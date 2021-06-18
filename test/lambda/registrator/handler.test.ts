import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import { CreateLogGroupRequest } from 'aws-sdk/clients/cloudwatchlogs';
import {
  GetRegistrationCodeResponse, GetRegistrationCodeRequest,
  RegisterCACertificateResponse, RegisterCACertificateRequest,
  CreateTopicRuleRequest,
} from 'aws-sdk/clients/iot';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import { handler } from '../../../src/lambda-assets/caRegistrator/index';
import {
  UnknownVerifierError,
} from '../../../src/lambda-assets/errors';

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

beforeEach(() => {
  AWS.config.region = 'local';
  AWSMock.mock('Iot', 'getRegistrationCode', (_param: GetRegistrationCodeRequest, callback: Function)=>{
    const response: GetRegistrationCodeResponse = {
      registrationCode: 'registration_code',
    };
    callback(null, response);
  });
  AWSMock.mock('Iot', 'registerCACertificate', (_param: RegisterCACertificateRequest, callback: Function)=>{
    const response: RegisterCACertificateResponse = {
      certificateId: 'ca_certificate_id',
      certificateArn: 'ca_certificate_arn',
    };
    callback(null, response);
  });
  AWSMock.mock('Iot', 'createTopicRule', (_param: CreateTopicRuleRequest, callback: Function)=>{
    callback(null, {});
  });
  AWSMock.mock('CloudWatchLogs', 'createLogGroup', (_param: CreateLogGroupRequest, callback: Function)=>{
    callback(null, {});
  });
  AWSMock.mock('S3', 'upload', (_param: PutObjectRequest, callback: Function)=>{
    callback(null, {});
  });
  process.env.DEIVCE_ACTIVATOR_QUEUE_URL = 'activator_queue_url';
  process.env.DEIVCE_ACTIVATOR_ROLE_ARN = 'activator_role_arn';
  process.env.AWS_REGION = 'us-east-1';
  process.env.test_verifier = 'arn_of_test_verifier';
  process.env.BUCKET_NAME = 'bucket_name';
  process.env.BUCKET_PREFIX = 'bucket_prefix';
  process.env.BUCKET_KEY = 'bucket_key';
});

afterEach(() => {
  AWSMock.restore();
});

test('Sucessfully execute the handler', async () => {
  var response = await handler(event);
  console.log('response: ');
  console.log(response);
  expect(response.statusCode).toBe(200);
});

test('Fail to upload the results', async () => {
  AWSMock.remock('S3', 'upload', (param: PutObjectRequest, callback: Function)=>{
    if (param.Body == '') {
      callback(null, {});
    } else {
      callback(new Error(), null);
    }
  });
  var response = await handler(event);
  expect(response.statusCode).toBe(500);
});

test('Fail to create Rule', async () => {
  AWSMock.remock('Iot', 'createTopicRule', (_param: CreateTopicRuleRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var response = await handler(event);
  expect(response.statusCode).toBe(500);
});

test('Fail to register CA', async () => {
  AWSMock.remock('Iot', 'registerCACertificate', (_param: RegisterCACertificateRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var response = await handler(event);
  expect(response.statusCode).toBe(500);
});

test('Fail to get CA registration code', async () => {
  AWSMock.remock('Iot', 'getRegistrationCode', (_param: GetRegistrationCodeRequest, callback: Function)=>{
    callback(new Error(), {});
  });
  var response = await handler(event);
  expect(response.statusCode).toBe(500);
});

test('Provide the wrong verifier', async () => {
  let eventWithWrongVerifier = Object.assign({}, event, {
    body: { verifierName: 'wrong' },
  });
  var response = await handler(eventWithWrongVerifier);
  expect(response.statusCode).toBe(UnknownVerifierError.code);
});