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

  const { certificateId } = JSON.parse(record.body);

  const { certificateDescription = {} } = await iotClient.send(
    new DescribeCertificateCommand({
      certificateId: certificateId,
    }),
  );

  const { caCertificateId, certificateArn } = await Joi.object({
    caCertificateId: Joi.string().required(),
    certificateArn: Joi.string().regex(/^arn/).required(),
  }).unknown(true)
    .validateAsync(certificateDescription).catch((error: Error) => {
      throw new InformationNotFoundError(error.message);
    });

  const { certificateDescription: caCertificateDescription } = await iotClient.send(
    new DescribeCACertificateCommand({
      certificateId: caCertificateId,
    }),
  );

  const { caCertificateArn } = await Joi.object({
    certificateArn: Joi.string().regex(/^arn/).required(),
  }).unknown(true)
    .validateAsync(caCertificateDescription).catch((error: Error) => {
      throw new InformationNotFoundError(error.message);
    });

  const { tags = [] } = await iotClient.send(
    new ListTagsForResourceCommand({
      resourceArn: caCertificateArn,
    }),
  );
  const { Value: verifierArn } = tags.find(tag => tag.Key === 'verifierArn') || { Value: '' };

  if (verifierArn) {
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
        FunctionName: decodeURIComponent(verifierArn),
        Payload: Buffer.from(
          JSON.stringify(certificateDescription),
        ),
      }),
    );

    // payload.reduce((acc: string = '', num: number) => acc + String.fromCharCode(num));
    let payloadString: string = '';
    payload.forEach(num => {
      payloadString += String.fromCharCode(num);
    });
    const { body } = JSON.parse(payloadString);


    await Joi.object({
      verified: Joi.boolean().allow(true).only().required(),
    }).required().unknown(true)
      .validateAsync(body).catch((error: Error) => {
        throw new VerificationError(error.message);
      });
    // console.log(body, verified);
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