import {
  DescribeCertificateCommand,
  UpdateCertificateCommand,
  IoTClient,
  CreateThingCommand,
  CreatePolicyCommand,
  AttachPolicyCommand,
  AttachThingPrincipalCommand,
} from '@aws-sdk/client-iot';
import {
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { Response } from '@softchef/lambda-events';
import * as Joi from 'joi';
import * as forge from 'node-forge';
import {
  VerificationError,
  InputError,
  PemParsingError,
  CertificateNotFounderror,
} from './errors';

/**
 * The lambda function handler activating the client certificates.
 * @param event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
export const handler = async (event: any = {}) : Promise <any> => {
  let response: Response = new Response();

  const iotClient: IoTClient = new IoTClient({});
  const lambdaClient: LambdaClient = new LambdaClient({});

  const recordSchema: Joi.ObjectSchema = Joi.object({
    certificateId: Joi.string().required(),
    verifierArn: Joi.string().regex(/^arn:/).allow(''),
  }).unknown(true);

  let [record] = event.Records;

  const { certificateId, verifierArn } = await recordSchema
  .validateAsync(JSON.parse(record.body)).catch((error: Error) => {
    throw new InputError(error.message);
  });

  const { certificateDescription = {} } = await iotClient.send(new DescribeCertificateCommand({
    certificateId: certificateId,
  }));

  const { certificateArn } = await Joi.string().required()
  .validateAsync(certificateDescription.certificateArn).catch((error: Error) => {
    throw new CertificateNotFounderror(error.message);
  });

  if (verifierArn) {
    const { Payload } = await lambdaClient.send(new InvokeCommand({
      FunctionName: decodeURIComponent(verifierArn),
      Payload: Buffer.from(JSON.stringify(certificateDescription)),
    }));

    const { body } = JSON.parse(new TextDecoder().decode(Payload));
    await Joi.object({
      verified: Joi.boolean().required().allow(true).only()
    }).unknown(true)
      .validateAsync(body).catch((error: Error) => {
        throw new VerificationError(error.message);
      });
  }
  
  let countryName: string;  
  try {
    const { certificatePem = '' } = certificateDescription;
    const clientCertificate = forge.pki.certificateFromPem(certificatePem);
    countryName = await Joi.string().required().validateAsync(
      clientCertificate.subject.attributes.find(attr => attr.shortName === 'C')
    );    
  } catch (error) {
    throw new PemParsingError(error.message);
  }

  const { thingName } = await iotClient.send(new CreateThingCommand({
    thingName: certificateId,
    attributePayload: {
      attributes: {
        'version': 'v1',
        'country': countryName
      }
    },
  }));

  const { policyName } = await iotClient.send(new CreatePolicyCommand({
    policyDocument: JSON.stringify({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "iot:Connect",
                    "iot:Publish",
                ],
                "Resource": '*'
            },
        ]
    }),
    policyName: `Policy-${certificateId}`,
  }));

  await iotClient.send(new AttachPolicyCommand({
    policyName: policyName,
    target: certificateArn
  }));

  await iotClient.send(new AttachThingPrincipalCommand({
    principal: certificateArn,
    thingName: thingName,
  }))

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