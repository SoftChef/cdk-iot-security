import * as path from 'path';
import {
  IoTClient,
  DescribeCACertificateCommand,
  ListTagsForResourceCommand,
} from '@aws-sdk/client-iot';
import {
  LambdaClient,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import {
  Request,
  Response,
} from '@softchef/lambda-events';
import * as Joi from 'joi';
import * as uuid from 'uuid';
import {
  CertificateGenerator,
} from '../certificate-generator';
import {
  InformationNotFoundError,
  VerificationError,
} from '../errors';

export const handler = async (event: any = {}) : Promise <any> => {
  const request = new Request(event);
  const response = new Response();
  const bucketName: string = process.env.BUCKET_NAME!;
  const bucketPrefix: string = process.env.BUCKET_PREFIX!;
  const caCertificateId: string = request.input('caCertificateId');
  const deviceInfo: string = request.input('deviceInfo');
  const thingName: string = request.input('thingName', uuid.v4());
  try {
    await verify(caCertificateId, deviceInfo);
    const caCertificates = await getCaCertificate(caCertificateId, bucketName, bucketPrefix);
    const deviceCertificates = CertificateGenerator.getDeviceRegistrationCertificates(caCertificates, {
      commonName: thingName,
    });
    deviceCertificates.certificate += caCertificates.certificate;
    return response.json(deviceCertificates);
  } catch (error) {
    return response.error(error.stack, error.code);
  }
};

async function verify(caCertificateId: string, deviceInfo: string) {
  const iotClient = new IoTClient({});
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
    } = await new LambdaClient({}).send(
      new InvokeCommand({
        FunctionName: decodeURIComponent(verifierName),
        Payload: Buffer.from(
          JSON.stringify(deviceInfo),
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
}

async function getCaCertificate(caCertificateId: string, bucketName: string, bucketPrefix: string) {
  const key = path.join(bucketPrefix, caCertificateId, 'ca-certificate.json');
  const { Body: fileStream } = await new S3Client({}).send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
  );
  const streamToString = (stream: any): Promise<string> =>
    new Promise((resolve, reject) => {
      const chunks: any[] = [];
      stream.on('data', (chunk: any) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
  const fileString = await streamToString(fileStream as any);
  const { ca: caCertificates } = JSON.parse(fileString);
  return caCertificates;
}