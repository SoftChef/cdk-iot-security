import * as path from 'path';
import {
  IoTClient,
  CreateProvisioningTemplateCommand,
  CreatePolicyCommand,
  CreateKeysAndCertificateCommand,
  AttachPolicyCommand,
} from '@aws-sdk/client-iot';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  Request,
  Response,
} from '@softchef/lambda-events';
import * as Joi from 'joi';
import {
  InputError,
} from '../errors';
import defaultIotPolicy from './default-iot-policy.json';
import defaultProvisionClaimPolicyStatements from './default-provision-claim-policy-statements.json';
import defaultTemplateBody from './default-template.json';

export const handler = async (event: any = {}) : Promise <any> => {
  const request: Request = new Request(event);
  const response: Response = new Response();
  const provisioningRoleArn: string = process.env.PROVISIONING_ROLE_ARN!;
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
    const [awsRegion, awsAccountId] = provisioningRoleArn.split(':').slice(3, 5);
    defaultIotPolicy.Statement = defaultIotPolicy.Statement.map((statement) => {
      statement.Resource = statement.Resource.map((resource) => {
        resource.replace('<region>', awsRegion);
        resource.replace('<account>', awsAccountId);
        resource.replace('<templateName>', request.input('templateName'));
        return resource;
      });
      return statement;
    });
    defaultTemplateBody.Resources.policy.Properties.PolicyDocument = JSON.stringify(defaultIotPolicy);
    const { templateArn, templateName } = await createProvisioningTemplate(
      request.input('templateName'),
      JSON.stringify(defaultTemplateBody),
      provisioningRoleArn,
    );
    const {
      provisionClaimCertificateArn,
      provisionClaimCertificateId,
      provisionClaimCertificatePem,
      keyPair,
    } = await createProvisioningClaimCertificate(templateArn, templateName, bucketName, bucketPrefix);
    await uploadToVault(
      bucketName,
      bucketPrefix,
      provisionClaimCertificateArn,
      provisionClaimCertificateId,
      provisionClaimCertificatePem,
      keyPair,
    );
    return response.json({
      provisionClaimCertificateArn,
      provisionClaimCertificateId,
    });
  } catch (error) {
    return response.error(error.stack, error.code);
  }
};

async function createProvisioningTemplate(inputTemplateName: string, inputTemplateBody: string, provisioningRoleArn: string) {
  const createProvisioningTemplateOutput = await new IoTClient({}).send(
    new CreateProvisioningTemplateCommand({
      templateName: inputTemplateName,
      templateBody: inputTemplateBody,
      provisioningRoleArn: provisioningRoleArn,
      enabled: true,
    }),
  );
  const { templateArn, templateName } = await Joi.object({
    templateArn: Joi.string().regex(/^arn/).required(),
    templateName: Joi.string().required(),
  }).required().unknown(true)
    .validateAsync(createProvisioningTemplateOutput);
  return { templateArn, templateName };
}

async function createProvisioningClaimCertificate(templateArn: string, templateName: string, bucketName: string, bucketPrefix: string) {
  const [awsRegion, awsAccountId] = templateArn.split(':').slice(3, 5);
  defaultProvisionClaimPolicyStatements.publish.Resource = [
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topic/$aws/certificates/create/*`,
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topic/$aws/provisioning-templates/${templateName}/provision/*`,
  ];
  defaultProvisionClaimPolicyStatements.subscribe.Resource = [
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topicfilter/$aws/certificates/create/*`,
    `arn:aws:iot:${awsRegion}:${awsAccountId}:topicfilter/$aws/provisioning-templates/${templateName}/provision/*`,
  ];
  const { policyName } = await new IoTClient({}).send(
    new CreatePolicyCommand({
      policyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          defaultProvisionClaimPolicyStatements.connect,
          defaultProvisionClaimPolicyStatements.publish,
          defaultProvisionClaimPolicyStatements.subscribe,
        ],
      }),
      policyName: `ProvisioningClaimCertificateliPolicy-${templateName}`,
    }),
  );

  const {
    certificateArn: provisionClaimCertificateArn,
    keyPair,
    certificatePem: provisionClaimCertificatePem,
    certificateId: provisionClaimCertificateId,
  } = await new IoTClient({}).send(
    new CreateKeysAndCertificateCommand({
      setAsActive: true,
    }),
  );

  await new IoTClient({}).send(
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
  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix || '', provisionClaimCertificateId!, 'provision_claim.cert.pem'),
      Body: Buffer.from(
        provisionClaimCertificatePem,
      ),
    }),
  );

  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix || '', provisionClaimCertificateId!, 'provision_claim.public_key.pem'),
      Body: Buffer.from(
        keyPair.PublicKey,
      ),
    }),
  );

  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix || '', provisionClaimCertificateId!, 'provision_claim.private_key.pem'),
      Body: Buffer.from(
        keyPair.PrivateKey,
      ),
    }),
  );

  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix || '', provisionClaimCertificateId!, 'provision-claim-certificate.json'),
      Body: Buffer.from(
        JSON.stringify({
          provisionClaimCertificateId,
          provisionClaimCertificateArn,
        }),
      ),
    }),
  );
}