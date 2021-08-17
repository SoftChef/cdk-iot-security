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
 * The lambda function handler for generating a device certificate authenticated with a specified CA.
 * @param event The HTTP request from the API gateway.
 * @returns The HTTP response containing the registration result.
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
 * Verify if the device is legal or not.
 * @param caCertificateId The specified CA ID.
 * @param deviceInfo The device information provided to the CA-specified verifier to verify the device.
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
 * Read the S3 file contents as a string.
 * @param bucketName The name of the AWS S3 Bucket storing CA certificate secrets.
 * @param key The key of the file.
 * @returns The string representation of the file.
 */
async function readS3File(bucketName: string, key: string) {
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
  return fileString;
}

/**
 * Get the public key, the private key, and the certificate of the specified CA.
 * @param caCertificateId The specified AWS IoT CA certificate ID.
 * @param bucketName The name of the AWS S3 Bucket storing CA certificate secrets.
 * @param bucketPrefix The key prefix of the secret files.
 * @returns The JSON object contains the PEM-formatted strings of public key, the private key, and the certificate of the specified CA
 */
async function getCaCertificate(caCertificateId: string, bucketName: string, bucketPrefix: string) {

  const prefix = path.join(bucketPrefix, caCertificateId);
  const keys = {
    publicKey: path.join(prefix, 'ca.public_key.pem'),
    privateKey: path.join(prefix, 'ca.private_key.pem'),
    certificate: path.join(prefix, 'ca.cert.pem'),
  };

  const privateKey = await readS3File(bucketName, keys.privateKey);
  const publicKey = await readS3File(bucketName, keys.publicKey);
  const certificate = await readS3File(bucketName, keys.certificate);
  const caCertificates = {
    publicKey,
    privateKey,
    certificate,
  };

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