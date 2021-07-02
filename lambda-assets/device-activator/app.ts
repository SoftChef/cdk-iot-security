import {
  DescribeCertificateCommand,
  DescribeCACertificateCommand,
  UpdateCertificateCommand,
  IoTClient,
  CreateThingCommand,
  CreatePolicyCommand,
  AttachPolicyCommand,
  AttachThingPrincipalCommand,
  ListTagsForResourceCommand,
} from '@aws-sdk/client-iot';
import {
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { Response } from '@softchef/lambda-events';
import * as Joi from 'joi';
import {
  VerificationError,
  InformationNotFoundError,
} from './errors';

/**
 * The lambda function handler activating the client certificates.
 * @param event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
export const handler = async (event: any = {}) : Promise <any> => {
  let response: Response = new Response();
  let [record] = event.Records;
  const iotClient: IoTClient = new IoTClient({});
  const lambdaClient: LambdaClient = new LambdaClient({});

  const { certificateId: deviceCertificateId } = JSON.parse(record.body);

  const { certificateDescription: deviceCertificateDescription = {} } = await iotClient.send(
    new DescribeCertificateCommand({
      certificateId: deviceCertificateId,
    }),
  );

  const { caCertificateId, certificateArn: deviceCertificateArn } = await Joi.object({
    caCertificateId: Joi.string().required(),
    certificateArn: Joi.string().regex(/^arn/).required(),
  }).unknown(true)
    .validateAsync(deviceCertificateDescription).catch((error: Error) => {
      throw new InformationNotFoundError(error.message);
    });

  const { certificateDescription: caCertificateDescription = {} } = await iotClient.send(
    new DescribeCACertificateCommand({
      certificateId: caCertificateId,
    }),
  );

  const { certificateArn: caCertificateArn } = await Joi.object({
    certificateArn: Joi.string().regex(/^arn/).required(),
  }).unknown(true)
    .validateAsync(caCertificateDescription).catch((error: Error) => {
      throw new InformationNotFoundError(error.message);
    });

  let { tags } = await iotClient.send(
    new ListTagsForResourceCommand({
      resourceArn: caCertificateArn,
    }),
  );
  tags = await Joi.array().items(
    Joi.object({
      Key: Joi.string().required(),
      Value: Joi.string(),
    }).optional(),
  ).required()
    .validateAsync(tags).catch((error: Error) => {
      throw new InformationNotFoundError(error.message);
    });
  const { Value: verifierName } = tags!.find(tag => tag.Key === 'verifierName') || { Value: '' };

  if (verifierName) {
    let {
      Payload: payload = new Uint8Array(
        Buffer.from(
          JSON.stringify({
            verified: false,
          }),
        ),
      ),
    } = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: decodeURIComponent(verifierName),
        Payload: Buffer.from(
          JSON.stringify(deviceCertificateDescription),
        ),
      }),
    );

    const { body } = JSON.parse(
      String.fromCharCode.apply(null, [...payload]),
    );

    await Joi.object({
      verified: Joi.boolean().allow(true).only().required(),
    }).required().unknown(true)
      .validateAsync(body).catch((error: Error) => {
        throw new VerificationError(error.message);
      });
  }

  const { thingName } = await iotClient.send(
    new CreateThingCommand({
      thingName: deviceCertificateId,
      attributePayload: {
        attributes: {
          version: 'v1',
        },
      },
    }),
  );

  const { policyName } = await iotClient.send(
    new CreatePolicyCommand({
      policyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iot:Connect',
              'iot:Publish',
            ],
            Resource: '*',
          },
        ],
      }),
      policyName: `Policy-${deviceCertificateId}`,
    }),
  );

  await iotClient.send(
    new AttachPolicyCommand({
      policyName: policyName,
      target: deviceCertificateArn,
    }),
  );

  await iotClient.send(
    new AttachThingPrincipalCommand({
      principal: deviceCertificateArn,
      thingName: thingName,
    }),
  );

  await iotClient.send(
    new UpdateCertificateCommand({
      certificateId: deviceCertificateId,
      newStatus: 'ACTIVE',
    }),
  );

  const message: any = response.json({
    certificateId: deviceCertificateId,
    verifierName: verifierName,
  });
  return message;
};