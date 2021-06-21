import {
  DescribeCertificateCommand,
  UpdateCertificateCommand,
  IoTClient,
  DescribeCertificateCommandOutput,
  DescribeCACertificateCommand,
  ListTagsForResourceCommand,
} from '@aws-sdk/client-iot';
import {
  InvokeCommand,
  InvokeCommandOutput,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { Response } from '@softchef/lambda-events';
import * as Joi from 'joi';
import {
  VerificationError,
  InputError,
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

  const {
    caCertificateId,
    certificateId,
  } = await recordSchema.validateAsync(JSON.parse(record.body)).catch((error: Error) => {
    throw new InputError(error.message);
  });

  const iotClient: IoTClient = new IoTClient({});
  const lambdaClient: LambdaClient = new LambdaClient({});

  const  {
    certificateDescription = { certificateArn: '' }
  } = await iotClient.send(new DescribeCACertificateCommand({ certificateId: caCertificateId }));

  const { tags = [] } = await iotClient.send(new ListTagsForResourceCommand({ resourceArn: certificateDescription.certificateArn}));  
  const { Value: verifierArn } = tags.find(tag => tag.Key === 'verifierArn') || { Value: '' };

  if (verifierArn) {
    const clientCertificateInfo: DescribeCertificateCommandOutput = await iotClient.send(new DescribeCertificateCommand({
      certificateId: certificateId,
    }));

    let output: InvokeCommandOutput = await lambdaClient.send(new InvokeCommand({
      FunctionName: decodeURIComponent(verifierArn),
      Payload: Buffer.from(JSON.stringify(clientCertificateInfo)),
    }));

    const payload: any = JSON.parse(new TextDecoder().decode(output.Payload));
    await Joi.object({ verified: Joi.boolean().required().allow(true).only() }).unknown(true)
      .validateAsync(payload.body).catch((error: Error) => {
        throw new VerificationError(error.message);
      });
  }

  await iotClient.send(new UpdateCertificateCommand({
    certificateId: certificateId,
    newStatus: 'ACTIVE',
  }));

  const message: any = response.json({
    certificateId: certificateId,
    verifierArn: verifierArn,
  });
  console.log(message);
  return message;
};