import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {
  GetRegistrationCodeRequest,
  GetRegistrationCodeResponse,
} from 'aws-sdk/clients/iot';
import { CaRegistrator } from '../../../src/lambda-assets/registrator/caRegistrator';

AWS.config.region = 'local';
AWSMock.setSDKInstance(AWS);

process.env.AWS_REGION = 'us-east-1';

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

test('initialize CaRegistrator', ()=>{
  const registrator = new CaRegistrator(event);
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

test('checkVerifier', ()=>{
  // Event with an unknown verifier
  var registrator = new CaRegistrator(event);
  registrator.checkVerifier();
  expect(registrator.response.statusCode)
    .toBe(registrator.errorCodes.errorOfUnknownVerifier);

  // Event with a known verifier
  process.env.test_verifier = event.body.verifier.arn;
  var registrator = new CaRegistrator(event);
  registrator.checkVerifier();
  expect(registrator.response).toBeNull();
  delete process.env.test_verifier;

  // Event without specifying a verifier
  var registrator = new CaRegistrator(
    Object.assign(event, { body: { verifier: {} } }));
  registrator.checkVerifier();
  expect(registrator.response).toBeNull();
});

test('getRegistrationCode', async ()=>{
  // Omit if already have response
  var registrator = new CaRegistrator(event);
  registrator.response = true;
  var result = await registrator.getRegistrationCode();
  expect(result).toBeUndefined();
  expect(registrator.results.registrationCode).toBeNull();

  // Success
  AWSMock.mock('Iot', 'getRegistrationCode', (
    _param: GetRegistrationCodeRequest, callback: Function)=>{
    const response: GetRegistrationCodeResponse = {
      registrationCode: 'registration_code',
    };
    callback(null, response);
  });
  var registrator = new CaRegistrator(event);
  registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  var registrationCode = await registrator.getRegistrationCode();
  expect(registrationCode).toBe('registration_code');
  expect(registrator.results.registrationCode).toBe('registration_code');

  // Simulate IoT SDK Error
  AWSMock.remock('Iot', 'getRegistrationCode', (
    _param: GetRegistrationCodeRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var registrator = new CaRegistrator(event);
  registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  var registrationCode = await registrator.getRegistrationCode();
  expect(registrationCode).toBeUndefined();
  expect(registrator.results.registrationCode).toBeNull();
  expect(registrator.response.statusCode)
    .toBe(registrator.errorCodes.errorOfGetRegistrationCode);

  AWSMock.restore('Iot');
});

test('createCertificates', async ()=>{
  // Omit if already have response
  var registrator = new CaRegistrator(event);
  registrator.response = true;
  var cert = registrator.createCertificates();
  expect(cert).toBeUndefined();
  expect(registrator.certificates).toMatchObject(nullCertificates);

  // Omit if having no registration code
  var registrator = new CaRegistrator(event);
  var cert = registrator.createCertificates();
  expect(cert).toBeUndefined();
  expect(registrator.certificates).toMatchObject(nullCertificates);

  // Success
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