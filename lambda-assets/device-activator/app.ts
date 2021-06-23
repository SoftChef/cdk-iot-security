import {
  DescribeCertificateCommand,
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
  InputError,
  InformationNotFoundError,
} from './errors';

/**
 * The lambda function handler activating the client certificates.
 * @param event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
export const handler = async (event: any = {}) : Promise <any> => {
  let response: Response = new Response();

  const recordSchema: Joi.ObjectSchema = Joi.object({
    caCertificateId: Joi.string().required(),
    certificateId: Joi.string().required(),
  }).unknown(true);

  let [record] = event.Records;

  // const {
  //   caCertificateId,
  //   certificateId,
  // } = await recordSchema.validateAsync(JSON.parse(record.body)).catch((error: Error) => {
  //   throw new InputError(error.message);
  // });
  const iotClient: IoTClient = new IoTClient({});
  const lambdaClient: LambdaClient = new LambdaClient({});

  const {
    caCertificateId,
    certificateId,
    // verifierArn
  } = JSON.parse(record.body);

  const { certificateDescription = {} } = await iotClient.send(
    new DescribeCertificateCommand({
      certificateId: certificateId,
    }),
  );

  const { certificateArn } = await Joi.object({
    certificateArn: Joi.string().required(),
  }).unknown(true)
  .validateAsync(certificateDescription).catch((error: Error) => {
    throw new InformationNotFoundError(error.message);
  });

  const { tags = [] } = await iotClient.send(
    new ListTagsForResourceCommand({
      resourceArn: certificateArn
    })
  );
  const { Value: verifierArn } = tags.find(tag => tag.Key === 'verifierArn') || { Value: '' };

  if (verifierArn) {
    const { Payload: payload = [] } = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: decodeURIComponent(verifierArn),
        Payload: Buffer.from(
          JSON.stringify(certificateDescription),
        ),
      }),
    );
    let payloadString: string = '';
    payload.forEach(num => {
      payloadString += String.fromCharCode(num);
    });
    const { body } = JSON.parse(payloadString);

    await Joi.object({
      verified: Joi.boolean().required().allow(true).only(),
    }).unknown(true)
      .validateAsync(body).catch((error: Error) => {
        throw new VerificationError(error.message);
      });
  }

  const { thingName } = await iotClient.send(
    new CreateThingCommand({
      thingName: certificateId,
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
      policyName: `Policy-${certificateId}`,
    }),
  );

  await iotClient.send(
    new AttachPolicyCommand({
      policyName: policyName,
      target: certificateArn,
    }),
  );

  await iotClient.send(
    new AttachThingPrincipalCommand({
      principal: certificateArn,
      thingName: thingName,
    }),
  );

  await iotClient.send(
    new UpdateCertificateCommand({
      certificateId: certificateId,
      newStatus: 'ACTIVE',
    }),
  );

  const message: any = response.json({
    certificateId: certificateId,
    verifierArn: verifierArn,
  });
  return message;
};