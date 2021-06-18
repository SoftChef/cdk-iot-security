import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {
  CreateLogGroupRequest,
} from 'aws-sdk/clients/cloudwatchlogs';
import {
  GetRegistrationCodeResponse,
  GetRegistrationCodeRequest,
  RegisterCACertificateResponse,
  RegisterCACertificateRequest,
  CreateTopicRuleRequest,
} from 'aws-sdk/clients/iot';
import {
  PutObjectRequest,
} from 'aws-sdk/clients/s3';
import { CaRegistrator } from '../../../src/lambda-assets/caRegistrator/caRegistrator';

AWS.config.region = 'local';

let event = {
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

const nullCertificates = {
  ca: {
    keys: {
      publicKey: null,
      privateKey: null,
    },
    certificate: null,
  },
  verification: {
    keys: {
      publicKey: null,
      privateKey: null,
    },
    certificate: null,
  },
};

const nullResults = {
  registrationCode: null,
  caRegistration: null,
  rule: null,
  upload: null,
};

beforeEach(() => {
  AWSMock.setSDKInstance(AWS);
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
  process.env.ACTIVATOR_QUEUE_URL = 'activator_queue_url';
  process.env.ACTIVATOR_ROLE_ARN = 'activator_role_arn';
  process.env.AWS_REGION = 'us-east-1';
  process.env.test_verifier = 'arn_of_test_verifier';
  process.env.BUCKET_NAME = 'bucket_name';
  process.env.BUCKET_PREFIX = 'bucket_prefix';
  process.env.BUCKET_KEY = 'bucket_key';
});

afterEach(() => {
  AWSMock.restore();
});

test('Initialize CaRegistrator', ()=>{
  let caRegistrator = new CaRegistrator(event);
  expect(caRegistrator.region).toBe(process.env.AWS_REGION);
  expect(caRegistrator.verifierName).toBe(event.body.verifierName);
  expect(caRegistrator.bucketName).toBe(process.env.BUCKET_NAME);
  expect(caRegistrator.bucketKey).toBe(process.env.BUCKET_KEY);
  expect(caRegistrator.bucketPrefix).toBe(process.env.BUCKET_PREFIX);
  expect(caRegistrator.csrSubjects).toBe(event.body.csrSubjects);
  expect(caRegistrator.certificates.ca.keys.privateKey).toBeNull();
  expect(caRegistrator.certificates).toMatchObject(nullCertificates);
  expect(caRegistrator.results).toMatchObject(nullResults);
});

test('Initialize CaRegistrator without specifying verifier', ()=>{
  let eventWithoutVerifier = Object.assign(
    {}, event, { body: { verifierName: null } });
  let caRegistrator = new CaRegistrator(eventWithoutVerifier);
  expect(caRegistrator.verifierName).toBeNull();
});

test('Initialize CaRegistrator without specifying CSR subjects', ()=>{
  let eventWithoutCsrSubjects = Object.assign(
    {}, event, { body: { csrSubjects: null } });
  let caRegistrator = new CaRegistrator(eventWithoutCsrSubjects);
  expect(caRegistrator.verifierName).toBeNull();
});

test('Call getRegistrationCode', async ()=>{
  let caRegistrator = new CaRegistrator(event);
  let { registrationCode } = await caRegistrator.getRegistrationCode();
  expect(registrationCode).toBe('registration_code');
});

test('Call createCertificates', async ()=>{
  let caRegistrator = new CaRegistrator(event);
  caRegistrator.results = Object.assign(
    caRegistrator.results, { registrationCode: 'registration_code' });
  let cert = caRegistrator.createCertificates();
  expect(cert).toBeDefined();
  expect(caRegistrator.certificates.ca.keys.privateKey).not.toBeNull();
  expect(caRegistrator.certificates.ca.keys.publicKey).not.toBeNull();
  expect(caRegistrator.certificates.ca.certificate).not.toBeNull();
  expect(caRegistrator.certificates.verification.keys.privateKey).not.toBeNull();
  expect(caRegistrator.certificates.verification.keys.publicKey).not.toBeNull();
  expect(caRegistrator.certificates.verification.certificate).not.toBeNull();
  expect(typeof caRegistrator.certificates.ca.certificate).toBe(typeof '');
  expect(typeof caRegistrator.certificates.ca.keys.privateKey).toBe(typeof '');
  expect(typeof caRegistrator.certificates.ca.keys.publicKey).toBe(typeof '');
  expect(typeof caRegistrator.certificates.verification.certificate).toBe(typeof '');
  expect(typeof caRegistrator.certificates.verification.keys.privateKey).toBe(typeof '');
  expect(typeof caRegistrator.certificates.verification.keys.publicKey).toBe(typeof '');
});

test('Call registerCa with CA config being provided', async ()=>{
  let caRegistrator = new CaRegistrator(event);
  caRegistrator.results = Object.assign(
    {}, caRegistrator.results, { registrationCode: 'registration_code' });
  caRegistrator.createCertificates();
  let result = await caRegistrator.registerCa();
  expect(result).toBeDefined();
});

test('Call createRule', async ()=>{
  let caRegistrator = new CaRegistrator(event);
  Object.assign(caRegistrator.results, {
    registrationCode: await caRegistrator.getRegistrationCode(),
  });
  caRegistrator.createCertificates();
  Object.assign(caRegistrator.results, {
    caRegistration: await caRegistrator.registerCa(),
  });
  let result = await caRegistrator.createRule();
  expect(result).toBeDefined();
});

test('Call upload', async ()=>{
  let caRegistrator = new CaRegistrator(event);
  Object.assign(caRegistrator.results, {
    registrationCode: await caRegistrator.getRegistrationCode(),
  });
  caRegistrator.createCertificates();
  Object.assign(caRegistrator.results, {
    caRegistration: await caRegistrator.registerCa(),
  });
  Object.assign(caRegistrator.results, {
    rule: await caRegistrator.createRule(),
  });
  let result = await caRegistrator.upload();
  expect(result).toBeDefined();
});
