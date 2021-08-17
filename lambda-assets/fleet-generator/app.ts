import * as path from 'path';
import {
  IoTClient,
  CreateProvisioningTemplateCommand,
  CreatePolicyCommand,
  CreateKeysAndCertificateCommand,
  AttachPolicyCommand,
  CreateRoleAliasCommand,
} from '@aws-sdk/client-iot';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  Request,
  Response,
} from '@softchef/lambda-events';
import {
  InputError,
} from '../errors';
import defaultGreengrassV2PolicyStatements from './default-greengrass-v2-policy-statements.json';
import defaultIotPolicy from './default-iot-policy.json';
import defaultProvisionClaimPolicyStatements from './default-provision-claim-policy-statements.json';
import defaultTemplateBody from './default-template.json';

/**
 * The lambda function handler generating the Fleet-Provisioning Template and the associated Provisioning Claim Certificate.
 * @param event The HTTP request from the API gateway.
 * @returns The HTTP response containing the activation results.
 */
export const handler = async (event: any = {}) : Promise <any> => {
  const request: Request = new Request(event);
  const response: Response = new Response();
  const greengrassTokenExchangeRoleArn: string = process.env.GREENGRASS_V2_TOKEN_EXCHANGE_ROLE_ARN ?? '';
  const fleetProvisioningRoleArn: string = process.env.FLEET_PROVISIONING_ROLE_ARN!;
  const bucketName: string = process.env.BUCKET_NAME!;
  const bucketPrefix: string = process.env.BUCKET_PREFIX!;
  try {
    const validated = request.validate(joi => {
      return {
        templateName: joi.string().required(),
      };
    });
    if (validated.error) {
      throw new InputError(JSON.stringify(validated.details));
    }
    const templateName = request.input('templateName');

    let policy = defaultIotPolicy;
    let roleAlias: string | undefined;
    let roleAliasArn: string | undefined;
    if (greengrassTokenExchangeRoleArn) {

      (
        { roleAlias, roleAliasArn } = await new IoTClient({}).send(
          new CreateRoleAliasCommand({
            roleAlias: `${templateName}-GreengrassTokenExachangeRoleAlias`,
            roleArn: greengrassTokenExchangeRoleArn,
          }),
        )
      );

      const greengrassPolicyStatement = defaultGreengrassV2PolicyStatements.greengrass;
      policy.Statement.push(greengrassPolicyStatement);

      const roleAliasPolicyStatement = defaultGreengrassV2PolicyStatements.roleAlias;
      roleAliasPolicyStatement.Resource = [];
      roleAliasPolicyStatement.Resource.push(roleAliasArn!);
      policy.Statement.push(roleAliasPolicyStatement);

    }
    defaultTemplateBody.Resources.policy.Properties.PolicyDocument = JSON.stringify(policy);

    const templateArn = await createProvisioningTemplate(templateName, fleetProvisioningRoleArn, defaultTemplateBody);
    const {
      provisionClaimCertificateArn,
      provisionClaimCertificateId,
      provisionClaimCertificatePem,
      keyPair,
    } = await createProvisioningClaimCertificate(templateArn!, templateName);

    let provisionClaimCertificateInfo = {
      templateName,
      provisionCliamCertificate: {
        provisionClaimCertificateArn,
        provisionClaimCertificateId,
      },
    };
    if (greengrassTokenExchangeRoleArn) {
      provisionClaimCertificateInfo = Object.assign(provisionClaimCertificateInfo, {
        roleAilas: {
          roleAlias,
          roleAliasArn,
        },
      });
    }

    await uploadToVault(
      bucketName,
      bucketPrefix,
      provisionClaimCertificateArn!,
      provisionClaimCertificateId!,
      provisionClaimCertificatePem!,
      keyPair!,
    );

    return response.json(provisionClaimCertificateInfo);
  } catch (error) {
    return response.error(error.stack, error.code);
  }
};

async function createProvisioningTemplate(templateName: string, provisioningRoleArn: string, templateBody: {[key: string]: any}) {

  const { templateArn } = await new IoTClient({}).send(
    new CreateProvisioningTemplateCommand({
      templateName: templateName,
      templateBody: JSON.stringify(templateBody),
      provisioningRoleArn: provisioningRoleArn,
      enabled: true,
    }),
  );

  return templateArn;
}

async function createProvisioningClaimCertificate(templateArn: string, templateName: string) {
  const [awsRegion, awsAccountId] = templateArn.split(':').slice(3, 5);
  defaultProvisionClaimPolicyStatements.publish.Resource = [
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topic/$aws/certificates/create/*`,
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topic/$aws/provisioning-templates/${templateName}/provision/*`,
  ];
  defaultProvisionClaimPolicyStatements.subscribe.Resource = [
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topicfilter/$aws/certificates/create/*`,
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topicfilter/$aws/provisioning-templates/${templateName}/provision/*`,
  ];
  const iotClient = new IoTClient({});
  const { policyName } = await iotClient.send(
    new CreatePolicyCommand({
      policyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          defaultProvisionClaimPolicyStatements.connect,
          defaultProvisionClaimPolicyStatements.publish,
          defaultProvisionClaimPolicyStatements.subscribe,
        ],
      }),
      policyName: `ProvisioningClaimCertificatePolicy-${templateName}`,
    }),
  );

  const {
    certificateArn: provisionClaimCertificateArn,
    keyPair,
    certificatePem: provisionClaimCertificatePem,
    certificateId: provisionClaimCertificateId,
  } = await iotClient.send(
    new CreateKeysAndCertificateCommand({
      setAsActive: true,
    }),
  );

  await iotClient.send(
    new AttachPolicyCommand({
      policyName: policyName,
      target: provisionClaimCertificateArn,
    }),
  );

  return {
    provisionClaimCertificateArn,
    provisionClaimCertificateId,
    provisionClaimCertificatePem,
    keyPair,
  };
}

async function uploadToVault(
  bucketName: string,
  bucketPrefix: string,
  provisionClaimCertificateArn: string,
  provisionClaimCertificateId: string,
  provisionClaimCertificatePem: string,
  keyPair: {[key:string]: string},
) {
  const s3Client = new S3Client({});
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, provisionClaimCertificateId!, 'provision_claim.cert.pem'),
      Body: Buffer.from(
        provisionClaimCertificatePem,
      ),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, provisionClaimCertificateId!, 'provision_claim.public_key.pem'),
      Body: Buffer.from(
        keyPair.PublicKey,
      ),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, provisionClaimCertificateId!, 'provision_claim.private_key.pem'),
      Body: Buffer.from(
        keyPair.PrivateKey,
      ),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, provisionClaimCertificateId!, 'provision-claim-certificate.json'),
      Body: Buffer.from(
        JSON.stringify({
          provisionClaimCertificateId,
          provisionClaimCertificateArn,
        }),
      ),
    }),
  );
}