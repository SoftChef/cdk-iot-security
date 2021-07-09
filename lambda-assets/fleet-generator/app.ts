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
import {
  InputError,
} from '../errors';

const deafultTemplateBody: string = '{ "Parameters" : { "AWS::IoT::Certificate::Country" : { "Type" : "String" }, "AWS::IoT::Certificate::Id" : { "Type" : "String" } }, "Resources" : { "thing" : { "Type" : "AWS::IoT::Thing", "Properties" : { "ThingName" : {"Ref" : "AWS::IoT::Certificate::Id"}, "AttributePayload" : { "version" : "v1", "country" : {"Ref" : "AWS::IoT::Certificate::Country"}} } }, "certificate" : { "Type" : "AWS::IoT::Certificate", "Properties" : { "CertificateId": {"Ref" : "AWS::IoT::Certificate::Id"}, "Status" : "ACTIVE" } }, "policy" : {"Type" : "AWS::IoT::Policy", "Properties" : { "PolicyDocument" : "{\\"Version\\": \\"2012-10-17\\",\\"Statement\\": [{\\"Effect\\":\\"Allow\\",\\"Action\\": [\\"iot:Connect\\",\\"iot:Publish\\"],\\"Resource\\" : [\\"*\\"]}]}" } } } }';

export const handler = async (event: any = {}) : Promise <any> => {
  const request: Request = new Request(event);
  const response: Response = new Response();
  const provisioningRoleArn: string = process.env.PROVISIONING_ROLE_ARN;
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
    const { templateArn, templateName } = await createProvisioningTemplate(
      request.input('templateName'),
      deafultTemplateBody,
      provisioningRoleArn,
    );
    const provisioningClaimCertificate = await createProvisioningClaimCertificate(templateArn, templateName, bucketName, bucketPrefix);
    return response.json({ provisioningClaimCertificate });
  } catch (error) {
    return response.error(error.stack);
  }
};

async function createProvisioningTemplate(inputTemplateName: string, inputTemplateBody: string, provisioningRoleArn: string) {
  const { templateArn, templateName } = await new IoTClient({}).send(
    new CreateProvisioningTemplateCommand({
      templateName: inputTemplateName,
      templateBody: inputTemplateBody,
      provisioningRoleArn: provisioningRoleArn,
    }),
  );
  return { templateArn, templateName };
}

async function createProvisioningClaimCertificate(templateArn: string, templateName: string, bucketName: string, bucketPrefix: string) {
  const [awsRegion, awsAccountId] = templateArn.split(':').slice(3, 5);
  const { policyName } = await new IoTClient({}).send(
    new CreatePolicyCommand({
      policyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['iot:Connect'],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'iot:Publish',
              'iot:Receive',
            ],
            Resource: [
              `arn:aws:iot:${awsRegion}:${awsAccountId}:topic/$aws/certificates/create/*`,
              `arn:aws:iot:${awsRegion}:${awsAccountId}:topic/$aws/provisioning-templates/${templateName}/provision/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: 'iot:Subscribe',
            Resource: [
              `arn:aws:iot:${awsRegion}:${awsAccountId}:topicfilter/$aws/certificates/create/*`,
              `arn:aws:iot:${awsRegion}:${awsAccountId}:topicfilter/$aws/provisioning-templates/${templateName}/provision/*`,
            ],
          },
        ],
      }),
      policyName: `ProvisioningClaimCertificateliPolicy-${templateName}`,
    }),
  );

  const {
    certificateArn,
    keyPair,
    certificatePem,
    certificateId,
  } = await new IoTClient({}).send(
    new CreateKeysAndCertificateCommand({
      setAsActive: true,
    }),
  );

  const provisioningClaimCertificate = {
    certificateArn,
    keyPair,
    certificatePem,
    certificateId,
  };

  await new IoTClient({}).send(
    new AttachPolicyCommand({
      policyName: policyName,
      target: provisioningClaimCertificate.certificateArn,
    }),
  );

  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix || '', certificateId!, 'ca-certificate.json'),
      Body: Buffer.from(
        JSON.stringify(provisioningClaimCertificate),
      ),
    }),
  );

  return provisioningClaimCertificate;
}