import {
  DescribeCertificateCommand,
  UpdateCertificateCommand,
  IoTClient,
  DescribeCertificateCommandOutput,
} from '@aws-sdk/client-iot';
import {
  InvokeCommand,
  InvokeCommandOutput,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { Response } from '@softchef/lambda-events';
import * as Joi from 'joi';
import {
  ParsingVerifyingResultError,
  InputError,
} from './errors';

/**
 * The lambda function handler activating the client certificates.
 * @param event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
export const handler = async (event: any = {}) : Promise <any> => {
  let response: Response = new Response();

  let [record] = event.Records;
  record = JSON.parse(record.body);

  const schema: Joi.ObjectSchema = Joi.object().keys({
    certificateId: Joi.string().required(),
    verifierArn: Joi.string().regex(/^arn:/),
  }).unknown(true);
  
  const { certificateId, verifierArn } = await schema.validateAsync(record).catch((error: Error) => {
    throw new InputError(error.message);
  });

  const iotClient: IoTClient = new IoTClient({});
  const lambdaClient: LambdaClient = new LambdaClient({});

  const clientCertificateInfo: DescribeCertificateCommandOutput = await iotClient.send(new DescribeCertificateCommand({
    certificateId: certificateId,
  }));

  let verified: boolean;
  if (verifierArn) {
    let result: InvokeCommandOutput = await lambdaClient.send(new InvokeCommand({
      FunctionName: decodeURIComponent(verifierArn),
      Payload: Buffer.from(JSON.stringify(clientCertificateInfo)),
    }));

    const payload: any = JSON.parse(new TextDecoder().decode(result.Payload));
    verified = await Joi.boolean().required().validateAsync(payload.body.verified).catch((error: Error) => {
      throw new ParsingVerifyingResultError(error.message);
    });
  } else {
    verified = true;
  }

  if (verified) {
    await iotClient.send(new UpdateCertificateCommand({
      certificateId: certificateId,
      newStatus: 'ACTIVE',
    }));
  }

  const message: any = response.json({
    certificateId: certificateId,
    verifierArn: verifierArn,
    verified: verified,
  });
  console.log(message);
  return message;
};