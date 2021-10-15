import * as crypto from 'crypto';
import * as path from 'path';
import {
  IoTClient,
  DescribeCACertificateCommand,
  ListTagsForResourceCommand,
  DescribeThingCommand,
  DeleteCertificateCommand,
  DeleteThingCommand,
  DescribeEndpointCommand,
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
  AwsError,
  InputError,
  InformationNotFoundError,
  VerificationError,
  EncryptionError,
} from '../errors';
import {
  csrSubjectsSchema,
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
    const deviceInfo: {[key: string]: any} = request.input('deviceInfo', {});
    let csrSubjects: CertificateGenerator.CsrSubjects = request.input('csrSubjects', {});
    if (!('commonName' in csrSubjects)) {
      csrSubjects.commonName = uuid.v4();
    }

    const thingName: string = csrSubjects.commonName!;

    try {
      await deletePreviousResources(thingName);
    } catch (error) {}

    const tags = await getCACertificateTags(caCertificateId);

    const {
      verifierName,
      encryption,
    } = tags;

    let device: {[key: string]: any} = {};
    if (verifierName) {
      device = await verify(verifierName, deviceInfo);
    }

    const caCertificates = await getCaCertificate(caCertificateId, bucketName, bucketPrefix);
    const deviceCertificates = CertificateGenerator.getDeviceRegistrationCertificates(caCertificates, csrSubjects);
    deviceCertificates.certificate += caCertificates.certificate;

    const endpoints = await getIoTEndpoints();

    const results = {
      endpoints,
      device,
      deviceCertificates,
    };

    if (encryption) {
      try {
        const {
          algorithm,
          iv,
          key,
        } = JSON.parse(encryption);

        const secrets = aesEncrypt(
          JSON.stringify(results),
          key,
          iv,
          algorithm,
        );
        return response.json({ secrets });
      } catch (error) {
        throw new EncryptionError();
      }
    } else {
      return response.json({ results });
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
async function verify(verifierName: string, deviceInfo: {[key: string]: any}) {
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

  const {
    device = {},
  } = body;

  return device;
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
    new DeleteThingCommand({
      thingName,
    }),
  );

  await client.send(
    new DeleteCertificateCommand({
      certificateId: attributes!.certificateId!,
    }),
  );
}

/**
 * Get the tags of the CA certificate.
 * @param caCertificateId the CA certificate ID.
 * @returns An object using tag key as its index and mapping to the tag value.
 */
async function getCACertificateTags(caCertificateId: string) {
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

  let { tags = [] } = await iotClient.send(
    new ListTagsForResourceCommand({
      resourceArn: caCertificateArn,
    }),
  );

  let tagObject: {[key: string]: string} = {};

  tags.map((tag) => {
    tagObject[tag.Key!] = tag.Value ?? '';
  });

  return tagObject;
}

/**
 * Get the IoT Endpoints.
 * @returns IoT Data-ATS and Credential Provider Endpoints
 */
async function getIoTEndpoints() {
  const iotClient = new IoTClient({});

  const dataEndpoint = await iotClient.send(
    new DescribeEndpointCommand({
      endpointType: 'iot:Data-ATS',
    }),
  );

  const credentialEndpoint = await iotClient.send(
    new DescribeEndpointCommand({
      endpointType: 'iot:CredentialProvider',
    }),
  );

  return {
    dataEndpoint,
    credentialEndpoint,
  };
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