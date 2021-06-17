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
import { CaRegistrator } from '../../../src/lambda-assets/registrator/caRegistrator';
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
});

afterEach(() => {
  AWSMock.restore();
});

test('Initialize CaRegistrator', ()=>{
  var registrator = new CaRegistrator(event);
  expect(registrator.region).toBe(process.env.AWS_REGION);
  expect(registrator.verifier).toMatchObject({
    name: 'test_verifier',
    arn: 'arn_of_test_verifier',
  });
  expect(registrator.bucket).toBe(event.body.bucket);
  expect(registrator.key).toBe(event.body.key);
  expect(registrator.csrSubjects).toBe(event.body.csrSubjects);
  expect(registrator.caConfig).toBe(event.body.caConfig);
  expect(registrator.certificates.ca.keys.privateKey).toBeNull();
  expect(registrator.certificates).toMatchObject(nullCertificates);
  expect(registrator.results).toMatchObject(nullResults);
});

test('Initialize CaRegistrator without specifying verifier', ()=>{
  var eventWithoutVerifier = Object.assign(
    {}, event, { body: { verifier: {} } });
  var registrator = new CaRegistrator(eventWithoutVerifier);
  expect(registrator.verifier).toMatchObject({});
});

test('Initialize CaRegistrator without specifying CSR subjects', ()=>{
  var eventWithoutCsrSubjects = Object.assign(
    {}, event, { body: { csrSubjects: null } });
  var registrator = new CaRegistrator(eventWithoutCsrSubjects);
  expect(registrator.verifier).toMatchObject({});
});

test('Call checkVerifier when an unknown verifier is specified', ()=>{
  var registrator = new CaRegistrator(event);
  registrator.checkVerifier();
  expect(registrator.response.statusCode)
    .toBe(errorCodes.errorOfUnknownVerifier);
});

test('Call checkVerifier when a known verifier is specified', ()=>{
  process.env.test_verifier = event.body.verifier.arn;
  var registrator = new CaRegistrator(event);
  registrator.checkVerifier();
  expect(registrator.response).toBeNull();
  delete process.env.test_verifier;
});

test('Call checkVerifier without any specified verifier', ()=>{
  var registrator = new CaRegistrator(
    Object.assign({}, event, { body: { verifier: {} } }));
  registrator.checkVerifier();
  expect(registrator.response).toBeNull();
});

test('Call checkBucket', async () => {
  var registrator = new CaRegistrator(event);
  await registrator.checkBucket();
  expect(registrator.response).toBeNull();
});

test('Call checkBucket without upload permission', async () => {
  AWSMock.remock('S3', 'upload', (_param: PutObjectRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var registrator = new CaRegistrator(event);
  await registrator.checkBucket();
  expect(registrator.response.statusCode)
    .toBe(errorCodes.errorOfBucketPermission);
});

test('Call getRegistrationCode', async ()=>{
  var registrator = new CaRegistrator(event);
  var { registrationCode } = await registrator.getRegistrationCode();
  expect(registrationCode).toBe('registration_code');
});

test('Call createCertificates', async ()=>{
  var registrator = new CaRegistrator(event);
  registrator.results = Object.assign(
    registrator.results, { registrationCode: 'registration_code' });
  var cert = registrator.createCertificates();
  expect(cert).toBeDefined();
  expect(registrator.certificates.ca.keys.privateKey).not.toBeNull();
  expect(registrator.certificates.ca.keys.publicKey).not.toBeNull();
  expect(registrator.certificates.ca.certificate).not.toBeNull();
  expect(registrator.certificates.verification.keys.privateKey).not.toBeNull();
  expect(registrator.certificates.verification.keys.publicKey).not.toBeNull();
  expect(registrator.certificates.verification.certificate).not.toBeNull();
  expect(typeof registrator.certificates.ca.certificate).toBe(typeof '');
  expect(typeof registrator.certificates.ca.keys.privateKey).toBe(typeof '');
  expect(typeof registrator.certificates.ca.keys.publicKey).toBe(typeof '');
  expect(typeof registrator.certificates.verification.certificate).toBe(typeof '');
  expect(typeof registrator.certificates.verification.keys.privateKey).toBe(typeof '');
  expect(typeof registrator.certificates.verification.keys.publicKey).toBe(typeof '');
});

test('Call registerCa with CA config being provided', async ()=>{
  var registrator = new CaRegistrator(event);
  registrator.results = Object.assign(
    {}, registrator.results, { registrationCode: 'registration_code' });
  registrator.createCertificates();
  var result = await registrator.registerCa();
  expect(result).toBeDefined();
});

test('Call registerCa without CA config being provided', async ()=>{
  var registrator = new CaRegistrator(event);
  registrator.caConfig = null;
  registrator.results = Object.assign(
    {}, registrator.results, { registrationCode: 'registration_code' });
  registrator.createCertificates();
  var result = await registrator.registerCa();
  expect(result).toBeDefined();
});

test('Call createRule', async ()=>{
  var registrator = new CaRegistrator(event);
  Object.assign(registrator.results, {
    registrationCode: await registrator.getRegistrationCode(),
  });
  registrator.createCertificates();
  Object.assign(registrator.results, {
    caRegistration: await registrator.registerCa(),
  });
  var result = await registrator.createRule();
  expect(result).toBeDefined();
});

test('Call upload', async ()=>{
  var registrator = new CaRegistrator(event);
  Object.assign(registrator.results, {
    registrationCode: await registrator.getRegistrationCode(),
  });
  registrator.createCertificates();
  Object.assign(registrator.results, {
    caRegistration: await registrator.registerCa(),
  });
  Object.assign(registrator.results, {
    rule: await registrator.createRule(),
  });
  var result = await registrator.upload();
  expect(result).toBeDefined();
});
