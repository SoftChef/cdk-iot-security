import {
  IoTClient,
  GetRegistrationCodeCommand,
  RegisterCACertificateCommand,
} from '@aws-sdk/client-iot';
import {
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../../../lambda-assets/ca-registrator/app';
import defaultIotPolicy from '../../../lambda-assets/ca-registrator/default-iot-policy.json';
import defaultTemplateBody from '../../../lambda-assets/ca-registrator/default-template.json';
import {
  VerifierError,
  InputError,
  ServerError,
} from '../../../lambda-assets/errors';

defaultTemplateBody.Resources.policy.Properties.PolicyDocument = JSON.stringify(defaultIotPolicy);

const event = {
  body: {
    csrSubjects: {
      commonName: '',
      countryName: 'TW',
      stateName: 'TP',
      localityName: 'TW',
      organizationName: 'Soft Chef',
      organizationUnitName: 'web',
    },
    verifierName: 'test_verifier',
  },
};

const verifiers = [
  'test_verifier1',
  'test_verifier',
];

const iotMock = mockClient(IoTClient);
const s3Mock = mockClient(S3Client);
const lambdaMock = mockClient(LambdaClient);

beforeEach(async () => {
  process.env.DEIVCE_ACTIVATOR_QUEUE_URL = 'activator_queue_url';
  process.env.DEIVCE_ACTIVATOR_ROLE_ARN = 'activator_role_arn';
  process.env.AWS_REGION = 'local';
  process.env.BUCKET_NAME = 'bucket_name';
  process.env.BUCKET_PREFIX = 'bucket_prefix';
  process.env.BUCKET_KEY = 'bucket_key';
  process.env.VERIFIERS = JSON.stringify(verifiers);
  iotMock.on(GetRegistrationCodeCommand).resolves({
    registrationCode: 'registration_code',
  });
  iotMock.on(RegisterCACertificateCommand).resolves({
    certificateId: 'ca_certificate_id',
    certificateArn: 'ca_certificate_arn',
  });
  s3Mock.on(PutObjectCommand).resolves({});
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

  test('On an empty event', async () => {
    var response = await handler();
    expect(response.statusCode).toBe(200);
  });

  test('Without providing a bucket prefix', async () => {
    process.env.BUCKET_PREFIX = '';
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('Without specifying a verifier in the event', async () => {
    let eventWithoutVerifier: any = Object.assign({}, event);
    delete eventWithoutVerifier.body.verifierName;
    var response = await handler(eventWithoutVerifier);
    expect(response.statusCode).toBe(200);
  });

  test('No recorded verifier ', async () => {
    Object.entries(verifiers).forEach(([key, _value]) => {
      delete process.env[key];
    });
    let eventWithoutVerifier: any = Object.assign({}, event);
    delete eventWithoutVerifier.body.verifierName;
    var response = await handler(eventWithoutVerifier);
    expect(response.statusCode).toBe(200);
  });

  test('No bucket prefix is provided', async () => {
    process.env.BUCKET_PREFIX = '';
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('On JITP mode', async () => {
    process.env.REGISTRATION_CONFIG_ROLE_ARN = 'arn:test_jitp_role';
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });
});

describe('On JITP mode', () => {

  beforeEach(async () => {
    process.env.REGISTRATION_CONFIG_ROLE_ARN = 'arn:test_jitp_role';
  });

  test('Basic Case', async () => {
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('Provide template body', async () => {
    let body = Object.assign({}, event.body, {
      templateBody: JSON.stringify(defaultTemplateBody),
    });
    var response = await handler({ body });
    expect(response.statusCode).toBe(200);
  });

  test('Provide encryption', async () => {
    let body = Object.assign({}, event.body, {
      encryption: {
        algorithm: 'aes-128-cbc',
        key: '1234567890123456',
        iv: '1234567890123456',
      },
    });
    var response = await handler({ body });
    expect(response.statusCode).toBe(200);
  });
});

describe('Fail on the AWS SDK error returns', () => {
  test('Fail to upload the results', async () => {
    s3Mock.on(PutObjectCommand).rejects(new Error());
    var response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  test('Fail to register CA', async () => {
    iotMock.on(RegisterCACertificateCommand).rejects(new Error());
    var response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  test('Fail to get CA registration code', async () => {
    iotMock.on(GetRegistrationCodeCommand).rejects(new Error());
    var response = await handler(event);
    expect(response.statusCode).toBe(500);
  });

  test('SDK return no certificationId and certificationArn when register CA', async () => {
    iotMock.on(RegisterCACertificateCommand).resolves({});
    var response = await handler(event);
    expect(response.statusCode).toBe(ServerError.code);
  });
});

describe('Fail on the provided wrong input data', () => {
  test('Fail when provide the wrong verifier', async () => {
    let eventWithWrongVerifier: any = Object.assign({}, event, {
      body: {
        verifierName: 'wrong',
        csrSubjects: {
          commonName: '',
          countryName: 'TW',
          stateName: 'TP',
          localityName: 'TW',
          organizationName: 'Soft Chef',
          organizationUnitName: 'web',
        },
      },
    });
    var response = await handler(eventWithWrongVerifier);
    expect(response.statusCode).toBe(VerifierError.code);
  });

  test('Fail when provide the wrong format of CSR subjects', async () => {
    let eventWithWrongFormatCsrSubject = Object.assign({}, event, {
      body: { csrSubjects: { commonName: {} } },
    });
    var response = await handler(eventWithWrongFormatCsrSubject);
    expect(response.statusCode).toBe(InputError.code);
  });
});

