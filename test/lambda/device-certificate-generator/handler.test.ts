import * as crypto from 'crypto';
import * as path from 'path';
import { Readable } from 'stream';
import {
  IoTClient,
  DescribeCACertificateCommand,
  ListTagsForResourceCommand,
  DescribeThingCommand,
  DeleteThingCommand,
  DeleteCertificateCommand,
  DescribeEndpointCommand,
} from '@aws-sdk/client-iot';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { CertificateGenerator } from '../../../lambda-assets/certificate-generator';
import {
  handler,
  aesEncrypt,
} from '../../../lambda-assets/device-certificate-generator/app';
import {
  InputError,
  InformationNotFoundError,
  VerificationError,
  EncryptionError,
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
  previousCertificateId: 'previous_certificate_id',
  credentialEndpoint: 'xxxxxxxxxxxxxx.credentials.iot.regoin.amazonaws.com',
  dataAtsEndpoint: 'xxxxxxxxxxxxxx-ats.iot.regoin.amazonaws.com',
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

  iotMock
    .on(DescribeCACertificateCommand, {
      certificateId: event.body.caCertificateId,
    })
    .resolves({
      certificateDescription: {
        certificateArn: expected.caCertificateArn,
      },
    });

  iotMock
    .on(ListTagsForResourceCommand, {
      resourceArn: expected.caCertificateArn,
    })
    .resolves({
      tags: [
        {
          Key: 'verifierName',
          Value: expected.verifierName,
        },
        {
          Key: 'other',
        },
      ],
    });

  iotMock
    .on(DescribeThingCommand, {
      thingName: event.body.csrSubjects.commonName,
    })
    .resolves({
      attributes: {
        certificateId: expected.previousCertificateId,
      },
    });

  iotMock
    .on(DeleteCertificateCommand, {
      certificateId: expected.previousCertificateId,
    })
    .resolves({});

  iotMock
    .on(DeleteThingCommand, {
      thingName: event.body.csrSubjects.commonName,
    })
    .resolves({});

  lambdaMock
    .on(InvokeCommand, {
      FunctionName: expected.verifierName,
    })
    .resolves({
      Payload: new Uint8Array(
        Buffer.from(JSON.stringify({ body: { verified: true } })),
      ),
    });

  s3Mock
    .on(GetObjectCommand, {
      Bucket: process.env.BUCKET_NAME,
      Key: path.join(
        process.env.BUCKET_PREFIX,
        event.body.caCertificateId,
        'ca.cert.pem',
      ),
    })
    .resolves({
      Body: Readable.from([
        new Uint8Array(Buffer.from(expected.caCertificates.ca.certificate)),
      ]),
    });

  s3Mock
    .on(GetObjectCommand, {
      Bucket: process.env.BUCKET_NAME,
      Key: path.join(
        process.env.BUCKET_PREFIX,
        event.body.caCertificateId,
        'ca.private_key.pem',
      ),
    })
    .resolves({
      Body: Readable.from([
        new Uint8Array(Buffer.from(expected.caCertificates.ca.privateKey)),
      ]),
    });

  s3Mock
    .on(GetObjectCommand, {
      Bucket: process.env.BUCKET_NAME,
      Key: path.join(
        process.env.BUCKET_PREFIX,
        event.body.caCertificateId,
        'ca.public_key.pem',
      ),
    })
    .resolves({
      Body: Readable.from([
        new Uint8Array(Buffer.from(expected.caCertificates.ca.publicKey)),
      ]),
    });

  iotMock
    .on(DescribeEndpointCommand, {
      endpointType: 'iot:Data-ATS',
    })
    .resolves({
      endpointAddress: expected.dataAtsEndpoint,
    });

  iotMock
    .on(DescribeEndpointCommand, {
      endpointType: 'iot:CredentialProvider',
    })
    .resolves({
      endpointAddress: expected.credentialEndpoint,
    });
});

afterEach(() => {
  iotMock.reset();
  s3Mock.reset();
  lambdaMock.reset();
});

describe('Sucessfully execute the handler', () => {
  test('On a regular event', async () => {
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('On CA has no tags', async () => {
    iotMock
      .on(ListTagsForResourceCommand, {
        resourceArn: expected.caCertificateArn,
      })
      .resolves({});
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('On CA specified no verifier', async () => {
    iotMock
      .on(ListTagsForResourceCommand, {
        resourceArn: expected.caCertificateArn,
      })
      .resolves({
        tags: [],
      });
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('On provide no thingName', async () => {
    delete process.env.OUTPUT_BUCKET_NAME;
    delete process.env.OUTPUT_BUCKET_PREFIX;
    const bodySpecifiedEncryption = Object.assign({}, event.body, {
      csrSubjects: {},
    });
    var response = await handler({
      body: bodySpecifiedEncryption,
    });
    expect(response.statusCode).toBe(200);
  });

  test('On provide AES key', async () => {
    delete process.env.OUTPUT_BUCKET_NAME;
    delete process.env.OUTPUT_BUCKET_PREFIX;
    iotMock
      .on(ListTagsForResourceCommand, {
        resourceArn: expected.caCertificateArn,
      })
      .resolves({
        tags: [
          {
            Key: 'verifierName',
            Value: expected.verifierName,
          },
          {
            Key: 'encryption',
            Value: JSON.stringify({
              algorithm: 'aes-128-cbc',
              iv: '1234567890123456',
              key: '1234567890123456',
            }),
          },
        ],
      });
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('Thing not exists', async () => {
    iotMock
      .on(DescribeThingCommand, {
        thingName: event.body.csrSubjects.commonName,
      })
      .rejects();

    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('Omit deleting thing exception', async () => {
    iotMock
      .on(DeleteThingCommand, {
        thingName: event.body.csrSubjects.commonName,
      })
      .rejects();

    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('Omit deleting certificate exception', async () => {
    iotMock
      .on(DeleteCertificateCommand, {
        certificateId: expected.previousCertificateId,
      })
      .rejects();

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
});

describe('Fail on the provided wrong input data', () => {
  test('On an empty event', async () => {
    var response = await handler();
    expect(response.statusCode).toBe(InputError.code);
  });

  test('Fail to verify the device', async () => {
    lambdaMock
      .on(InvokeCommand, {
        FunctionName: expected.verifierName,
      })
      .resolves({});
    var response = await handler(event);
    expect(response.statusCode).toBe(VerificationError.code);
  });

  test('On algorithm not allowed', async () => {
    iotMock
      .on(ListTagsForResourceCommand, {
        resourceArn: expected.caCertificateArn,
      })
      .resolves({
        tags: [
          {
            Key: 'verifierName',
            Value: expected.verifierName,
          },
          {
            Key: 'encryption',
            Value: JSON.stringify({
              algorithm: 'algorithm-not-allowed',
              iv: '1234567890123456',
              key: '1234567890123456',
            }),
          },
        ],
      });
    var response = await handler(event);
    expect(response.statusCode).toBe(EncryptionError.code);
  });

  test('On iv length not 16', async () => {
    iotMock
      .on(ListTagsForResourceCommand, {
        resourceArn: expected.caCertificateArn,
      })
      .resolves({
        tags: [
          {
            Key: 'verifierName',
            Value: expected.verifierName,
          },
          {
            Key: 'encryption',
            Value: JSON.stringify({
              algorithm: 'aes-128-cbc',
              iv: '12345678901234561',
              key: '1234567890123456',
            }),
          },
        ],
      });
    var response = await handler(event);
    expect(response.statusCode).toBe(EncryptionError.code);
  });

  test('On key length not 16', async () => {
    iotMock
      .on(ListTagsForResourceCommand, {
        resourceArn: expected.caCertificateArn,
      })
      .resolves({
        tags: [
          {
            Key: 'verifierName',
            Value: expected.verifierName,
          },
          {
            Key: 'encryption',
            Value: JSON.stringify({
              algorithm: 'aes-128-cbc',
              iv: '1234567890123456',
              key: '12345678901234561',
            }),
          },
        ],
      });
    var response = await handler(event);
    expect(response.statusCode).toBe(EncryptionError.code);
  });
});

describe('Test device certificate encryption methods', () => {
  test('AES encryption is correct', () => {
    const {
      ca: {
        privateKey: caPrivateKey,
        publicKey: caPublicKey,
        certificate: caCertificate,
      },
    } = CertificateGenerator.getCaRegistrationCertificates();
    const deviceCertificates =
      CertificateGenerator.getDeviceRegistrationCertificates({
        privateKey: caPrivateKey,
        publicKey: caPublicKey,
        certificate: caCertificate,
      });
    deviceCertificates.certificate += caCertificate;

    const aesKey = '1234567890123456';
    const iv = '1234567890123456';
    const algorithm = 'aes-128-cbc';

    const data = JSON.stringify(deviceCertificates);

    const encrypted = aesEncrypt(data, aesKey, iv, algorithm);

    let cipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(aesKey),
      Buffer.from(iv),
    );
    let decrypted = cipher.update(encrypted, 'base64', 'utf8');
    decrypted += cipher.final('utf8');

    expect(decrypted).toBe(data);
  });
});
