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
  PutObjectCommand,
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
  InputError,
  InformationNotFoundError,
  VerificationError,
} from '../errors';
import {
  csrSubjectsSchema,
} from '../schemas';

/**
 * The lambda function handler generating the device certificates.
 * @param event The HTTP request specifying the CA ID for authentication and the thing name for provisioning,
 * and attach the additional device information for verifying whether the device is legal or not.
 * If the thing name is not specified, a UUID is applied.
 * @returns The generated device certificates, including the certificate, the private key, and the public key.
 */
export const handler = async (event: any = {}) : Promise <any> => {
  const request = new Request(event);
  const response = new Response();
  const bucketName: string = process.env.BUCKET_NAME!;
  const bucketPrefix: string = process.env.BUCKET_PREFIX!;
  const outputBucketName: string | undefined = process.env.OUTPUT_BUCKET_NAME;
  const outputBucketPrefix: string = process.env.OUTPUT_BUCKET_PREFIX ?? '';
  try {
    const validated = request.validate(joi => {
      return {
        csrSubjects: csrSubjectsSchema,
        caCertificateId: joi.string().required(),
        deviceInfo: joi.object().default({}),
      };
    });
    if (validated.error) {
      throw new InputError(JSON.stringify(validated.details));
    }
    const caCertificateId: string = request.input('caCertificateId');
    const deviceInfo: string = request.input('deviceInfo');
    let csrSubjects: CertificateGenerator.CsrSubjects = request.input('csrSubjects', {
      commonName: uuid.v4(),
      countryName: '',
      stateName: '',
      localityName: '',
      organizationName: '',
      organizationUnitName: '',
    });

    await verify(caCertificateId, deviceInfo);
    const caCertificates = await getCaCertificate(caCertificateId, bucketName, bucketPrefix);
    const deviceCertificates = CertificateGenerator.getDeviceRegistrationCertificates(caCertificates, csrSubjects);
    deviceCertificates.certificate += caCertificates.certificate;
    if (outputBucketName) {
      await uploadDeviceCertificate(deviceCertificates, outputBucketName, outputBucketPrefix, csrSubjects.commonName!);
      return response.json({ success: true });
    } else {
      return response.json(deviceCertificates);
    }
  } catch (error) {
    return response.error(error.stack, error.code);
  }
};

/**
 * Verify if the device is legal or not. If the device is not legal, a verification error would be thrown.
 * @param caCertificateId The ID of the CA which is specified to authenticate the generated device certificates.
 * @param deviceInfo The data to pass to the verifier.
 */
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

/**
 * Get the CA certificates from the vault.
 * @param caCertificateId The ID of the CA which is specified to authenticate the generated device certificates.
 * @param bucketName The name of the bucket storing CA certificates.
 * @param bucketPrefix The prefix of the path storing CA certificates.
 * @returns The CA certificates set.
 */
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

async function uploadDeviceCertificate(
  deviceCertificates: CertificateGenerator.CertificateSet,
  outputBucketName: string,
  outputBucketPrefix: string,
  thingName: string,
) {

  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: outputBucketName,
      Key: path.join(outputBucketPrefix, thingName, 'device.cert.pem'),
      Body: Buffer.from(deviceCertificates.certificate),
    }),
  );

  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: outputBucketName,
      Key: path.join(outputBucketPrefix, thingName, 'device.private_key.pem'),
      Body: Buffer.from(deviceCertificates.privateKey),
    }),
  );

  await new S3Client({}).send(
    new PutObjectCommand({
      Bucket: outputBucketName,
      Key: path.join(outputBucketPrefix, thingName, 'device.public_key.pem'),
      Body: Buffer.from(deviceCertificates.publicKey),
    }),
  );

}