import * as path from 'path';
import { Readable } from 'stream';
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
import { mockClient } from 'aws-sdk-client-mock';
import { CertificateGenerator } from '../../../lambda-assets/certificate-generator';
import { handler } from '../../../lambda-assets/device-certificate-generator/app';
import {
  InputError,
  InformationNotFoundError,
  VerificationError,
} from '../../../lambda-assets/errors';

const event = {
  body: {
    caCertificateId: 'test_ca_certificate_id',
    csrSubjects: {
      commonName: 'myThingName',
    },
    deviceInfo: {
      name: 'test_device',
    },
  },
};

const expected = {
  caCertificateArn: 'arn:ca_certificate',
  verifierName: 'test_verifier',
  caCertificates: CertificateGenerator.getCaRegistrationCertificates(),
  bucketName: 'bucket_name',
  bucketPrefix: 'bucket_prefix',
  outputBucketName: 'output_bucket_name',
  outputBucketPrefix: 'output_bucket_prefix',
};

const iotMock = mockClient(IoTClient);
const s3Mock = mockClient(S3Client);
const lambdaMock = mockClient(LambdaClient);

beforeEach(async () => {

  process.env.AWS_REGION = 'local';
  process.env.BUCKET_NAME = expected.bucketName;
  process.env.BUCKET_PREFIX = expected.bucketPrefix;
  process.env.BUCKET_KEY = 'bucket_key';
  process.env.OUTPUT_BUCKET_NAME = expected.outputBucketName;
  process.env.OUTPUT_BUCKET_PREFIX = expected.outputBucketPrefix;

  iotMock.on(DescribeCACertificateCommand, {
    certificateId: event.body.caCertificateId,
  }).resolves({
    certificateDescription: {
      certificateArn: expected.caCertificateArn,
    },
  });

  iotMock.on(ListTagsForResourceCommand, {
    resourceArn: expected.caCertificateArn,
  }).resolves({
    tags: [
      {
        Key: 'verifierName',
        Value: expected.verifierName,
      },
    ],
  });

  lambdaMock.on(InvokeCommand, {
    FunctionName: expected.verifierName,
  }).resolves({
    Payload: new Uint8Array(
      Buffer.from(
        JSON.stringify({ body: { verified: true } }),
      ),
    ),
  });

  s3Mock.on(GetObjectCommand, {
    Bucket: process.env.BUCKET_NAME,
    Key: path.join(process.env.BUCKET_PREFIX, event.body.caCertificateId, 'ca.cert.pem'),
  }).resolves({
    Body: Readable.from([
      new Uint8Array(
        Buffer.from(
          expected.caCertificates.ca.certificate,
        ),
      ),
    ]),
  });

  s3Mock.on(GetObjectCommand, {
    Bucket: process.env.BUCKET_NAME,
    Key: path.join(process.env.BUCKET_PREFIX, event.body.caCertificateId, 'ca.private_key.pem'),
  }).resolves({
    Body: Readable.from([
      new Uint8Array(
        Buffer.from(
          expected.caCertificates.ca.privateKey,
        ),
      ),
    ]),
  });

  s3Mock.on(GetObjectCommand, {
    Bucket: process.env.BUCKET_NAME,
    Key: path.join(process.env.BUCKET_PREFIX, event.body.caCertificateId, 'ca.public_key.pem'),
  }).resolves({
    Body: Readable.from([
      new Uint8Array(
        Buffer.from(
          expected.caCertificates.ca.publicKey,
        ),
      ),
    ]),
  });

  s3Mock.on(PutObjectCommand, {
    Bucket: process.env.OUTPUT_BUCKET_NAME,
    Key: path.join(process.env.OUTPUT_BUCKET_PREFIX, event.body.csrSubjects.commonName, 'device.cert.pem'),
  }).resolves({});

  s3Mock.on(PutObjectCommand, {
    Bucket: process.env.OUTPUT_BUCKET_NAME,
    Key: path.join(process.env.OUTPUT_BUCKET_PREFIX, event.body.csrSubjects.commonName, 'device.private_key.pem'),
  }).resolves({});

  s3Mock.on(PutObjectCommand, {
    Bucket: process.env.OUTPUT_BUCKET_NAME,
    Key: path.join(process.env.OUTPUT_BUCKET_PREFIX, event.body.csrSubjects.commonName, 'device.public_key.pem'),
  }).resolves({});

});

afterEach(() => {
  iotMock.reset();
  s3Mock.reset();
  lambdaMock.reset();
});

describe('Sucessfully execute the handler', () => {

  test('On a regular event', async () => {
    var response = await handler(event);
    console.log(response);
    expect(response.statusCode).toBe(200);
  });

  test('On CA specified no verifier', async () => {
    iotMock.on(ListTagsForResourceCommand, {
      resourceArn: expected.caCertificateArn,
    }).resolves({
      tags: [],
    });
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('On provide no device certificate vault', async () => {
    delete process.env.OUTPUT_BUCKET_NAME;
    delete process.env.OUTPUT_BUCKET_PREFIX;
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

});

describe('Fail on the AWS SDK error returns', () => {

  test('Fail to describe CA', async () => {
    iotMock.on(DescribeCACertificateCommand).rejects(new Error());
    var response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  test('SDK return no CA certificationArn when describe CA', async () => {
    iotMock.on(DescribeCACertificateCommand).resolves({});
    var response = await handler(event);
    expect(response.statusCode).toBe(InformationNotFoundError.code);
  });

  test('SDK return no CA tag array, even an empty array, when list CA tags', async () => {
    iotMock.on(ListTagsForResourceCommand).resolves({});
    var response = await handler(event);
    expect(response.statusCode).toBe(InformationNotFoundError.code);
  });

  test('Fail to upload device certificate', async () => {
    s3Mock.on(PutObjectCommand, {
      Bucket: process.env.OUTPUT_BUCKET_NAME!,
      Key: path.join(process.env.OUTPUT_BUCKET_PREFIX!, event.body.csrSubjects.commonName, 'device.cert.pem'),
    }).rejects(new Error());
    var response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  test('Fail to upload device private key', async () => {
    s3Mock.on(PutObjectCommand, {
      Bucket: process.env.OUTPUT_BUCKET_NAME!,
      Key: path.join(process.env.OUTPUT_BUCKET_PREFIX!, event.body.csrSubjects.commonName, 'device.private_key.pem'),
    }).rejects(new Error());
    var response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  test('Fail to upload device public key', async () => {
    s3Mock.on(PutObjectCommand, {
      Bucket: process.env.OUTPUT_BUCKET_NAME!,
      Key: path.join(process.env.OUTPUT_BUCKET_PREFIX!, event.body.csrSubjects.commonName, 'device.public_key.pem'),
    }).rejects(new Error());
    var response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

});

describe('Fail on the provided wrong input data', () => {

  test('On an empty event', async () => {
    var response = await handler();
    expect(response.statusCode).toBe(InputError.code);
  });

  test('Fail to verify the device', async () => {
    lambdaMock.on(InvokeCommand, {
      FunctionName: expected.verifierName,
    }).resolves({});
    var response = await handler(event);
    expect(response.statusCode).toBe(VerificationError.code);
  });

});

