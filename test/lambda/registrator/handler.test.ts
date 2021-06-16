import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import { CreateLogGroupRequest } from 'aws-sdk/clients/cloudwatchlogs';
import {
  GetRegistrationCodeResponse, GetRegistrationCodeRequest,
  RegisterCACertificateResponse, RegisterCACertificateRequest,
  CreateTopicRuleRequest,
} from 'aws-sdk/clients/iot';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as errorCodes from '../../../src/lambda-assets/registrator/errorCodes';

AWS.config.region = 'local';

var event = {
  body: {
    csrSubjects: {
      commonName: '',
      countryName: 'TW',
      stateName: 'TP',
      localityName: 'TW',
      organizationName: 'Soft Chef',
      organizationUnitName: 'web',
    },
    verifier: {
      name: 'test_verifier',
      arn: 'arn_of_test_verifier',
    },
    bucket: 'bucketName',
    key: 'ca.json',
    caConfig: {
      allowAutoRegistration: true,
      registrationConfig: {},
      setAsActive: true,
      tags: [{ Key: 'ca', Value: '01' }],
    },
  },
};

process.env.AWS_REGION = 'local';
process.env.ACTIVATOR_QUEUE_URL = 'activator_queue_url';
process.env.ACTIVATOR_ROLE_ARN = 'activator_role_arn';
process.env.test_verifier = event.body.verifier.arn;

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

import { handler } from '../../../src/lambda-assets/registrator/index';

afterAll(() => {
  AWSMock.restore();
});

test('Sucessfully execute the handler', async () => {
  var response = await handler(event);
  expect(response.statusCode).toBe(200);
});

test('Fail to upload the results', async () => {
  AWSMock.remock('S3', 'upload', (_param: PutObjectRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var response = await handler(event);
  expect(response.statusCode)
    .toBe(errorCodes.errorOfUploadingResult);
});

test('Fail to create Rule', async () => {
  AWSMock.remock('Iot', 'createTopicRule', (_param: CreateTopicRuleRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var response = await handler(event);
  expect(response.statusCode)
    .toBe(errorCodes.errorOfCreateIotRule);
});

test('Fail to register CA', async () => {
  AWSMock.remock('Iot', 'registerCACertificate', (_param: RegisterCACertificateRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var response = await handler(event);
  expect(response.statusCode)
    .toBe(errorCodes.errorOfCaRegistration);
});

test('Fail to get CA registration code', async () => {
  AWSMock.remock('Iot', 'getRegistrationCode', (_param: GetRegistrationCodeRequest, callback: Function)=>{
    callback(new Error(), {});
  });
  var response = await handler(event);
  expect(response.statusCode)
    .toBe(errorCodes.errorOfGetRegistrationCode);
});
