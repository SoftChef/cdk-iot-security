import * as crypto from 'crypto';
import * as path from 'path';
import {
  IoTClient,
  DescribeCACertificateCommand,
  ListTagsForResourceCommand,
  DescribeThingCommand,
  DeleteCertificateCommand,
  DeleteThingCommand,
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
  AwsError,
  InputError,
  InformationNotFoundError,
  VerificationError,
} from '../errors';
import {
  csrSubjectsSchema,
  encryptionSchema,
} from '../schemas';

/**
 * The lambda function handler for generating a device certificate authenticated with a specified CA.
 * @param event The HTTP request from the API gateway.
 *
 * event = {
 *
 *  ...
 *
 *  "body": {
 *
 *    "caCertificateId": "\<AWS IoT CA Certificate ID\>",
 *
 *    "deviceInfo": "\<The JSON object containing the information of the device\>",
 *
 *    "csrSubjects": {
 *
 *      "commonName": "\<The thing name of this AWS IoT thing\>"
 *
 *    },
 *
 *    "encryption": {
 *
 *      "algorithm": "\<The specified encryption algorthim\>",
 *
 *      "iv": "\<The initial vector\>",
 *
 *      "key": "\<The key for encrypting\>"
 *
 *    }
 *
 *  }
 *
 *  ...
 *
 * }
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
        encryption: outputBucketName? encryptionSchema.allow(null) : encryptionSchema,
      };
    });
    if (validated.error) {
      throw new InputError(JSON.stringify(validated.details));
    }
    const caCertificateId: string = request.input('caCertificateId');
    const deviceInfo: {[key: string]: any} = request.input('deviceInfo', {});
    let csrSubjects: CertificateGenerator.CsrSubjects = request.input('csrSubjects', {
      commonName: uuid.v4(),
      countryName: '',
      stateName: '',
      localityName: '',
      organizationName: '',
      organizationUnitName: '',
    });

    const thingName: string = csrSubjects.commonName!;

    try {
      await deletePreviousResources(thingName);
    } catch (error) {}

    await verify(caCertificateId, deviceInfo);
    const caCertificates = await getCaCertificate(caCertificateId, bucketName, bucketPrefix);
    const deviceCertificates = CertificateGenerator.getDeviceRegistrationCertificates(caCertificates, csrSubjects);
    deviceCertificates.certificate += caCertificates.certificate;

    const encyption = request.input('encryption', null);
    if (encyption != null) {
      const {
        algorithm,
        iv,
        key,
      } = encyption;

      const secrets = aesEncrypt(
        JSON.stringify(deviceCertificates),
        key,
        iv,
        algorithm,
      );
      return response.json({ secrets });
    } else {
      await uploadDeviceCertificate(deviceCertificates, outputBucketName!, outputBucketPrefix, thingName);
      return response.json({
        success: true,
        thingName,
      });
    }
  } catch (error) {
    return response.error((error as AwsError).stack, (error as AwsError).code);
  }
};

/**
 * Verify if the device is legal or not.
 * @param caCertificateId The specified CA ID.
 * @param deviceInfo The device information provided to the CA-specified verifier to verify the device.
 */
async function verify(caCertificateId: string, deviceInfo: {[key: string]: any}) {
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
  const s3Client = new S3Client({});

  await s3Client.send(
    new PutObjectCommand({
      Bucket: outputBucketName,
      Key: path.join(outputBucketPrefix, thingName, 'device.cert.pem'),
      Body: Buffer.from(deviceCertificates.certificate),
      BucketKeyEnabled: true,
      ServerSideEncryption: 'aws:kms',
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: outputBucketName,
      Key: path.join(outputBucketPrefix, thingName, 'device.private_key.pem'),
      Body: Buffer.from(deviceCertificates.privateKey),
      BucketKeyEnabled: true,
      ServerSideEncryption: 'aws:kms',
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: outputBucketName,
      Key: path.join(outputBucketPrefix, thingName, 'device.public_key.pem'),
      Body: Buffer.from(deviceCertificates.publicKey),
      BucketKeyEnabled: true,
      ServerSideEncryption: 'aws:kms',
    }),
  );

}

/**
 * Delete the AWS IoT resources created before for the specified thing name.
 * @param thingName The name of the thing with is according to the common name of the CSR subjects.
 */
async function deletePreviousResources(thingName: string) {
  const client = new IoTClient({});

  const {
    attributes,
  } = await client.send(
    new DescribeThingCommand({
      thingName,
    }),
  );

  await client.send(
    new DeleteCertificateCommand({
      certificateId: attributes!.certificateId!,
    }),
  );

  await client.send(
    new DeleteThingCommand({
      thingName,
    }),
  );
}

/*
 * Encrypt the data with AES algorithm.
 * @param data The data to be encrypted.
 * @param key The key for AES encryption.
 * @param iv The initialization vector for AES encryption.
 * @returns The AES-encrypted data.
 */
export function aesEncrypt(data: string, key: string, iv: string, algorithm: string) {
  let keyBuffer = Buffer.from(key);
  let ivBuffer = Buffer.from(iv);
  let cipher = crypto.createCipheriv(algorithm, keyBuffer, ivBuffer);
  let encrypted = cipher.update(data, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}