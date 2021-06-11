import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {
  GetRegistrationCodeResponse,
  GetRegistrationCodeRequest,
  RegisterCACertificateResponse,
  RegisterCACertificateRequest,
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

test('registerCa', async ()=>{
  AWSMock.mock('Iot', 'getRegistrationCode', (_param: GetRegistrationCodeRequest, callback: Function)=>{
    const response: GetRegistrationCodeResponse = {
      registrationCode: 'registration_code',
    };
    callback(null, response);
  });
  AWSMock.mock('Iot', 'registerCACertificate', (param: RegisterCACertificateRequest, callback: Function)=>{
    const response: RegisterCACertificateResponse = {
      certificateId: 'ca_certificate_id',
      certificateArn: 'ca_certificate_arn',
    };
    if (param.caCertificate && param.verificationCertificate) {
      callback(null, response);
    } else {
      callback(new Error(), null);
    }
  });

  // Omit if already have response
  var registrator = new CaRegistrator(event);
  registrator.response = true;
  var result = await registrator.registerCa();
  expect(result).toBeUndefined();
  expect(registrator.results.caRegistration).toBeNull();

  // Omit if have not created certificates
  var registrator = new CaRegistrator(event);
  registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  await registrator.getRegistrationCode();
  var result = await registrator.registerCa();
  expect(result).toBeUndefined();
  expect(registrator.results.caRegistration).toBeNull();
  expect(registrator.response).toBeNull();

  // Success
  var registrator = new CaRegistrator(event);
  registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  await registrator.getRegistrationCode();
  registrator.createCertificates();
  var result = await registrator.registerCa();
  expect(result).toBeDefined();
  expect(registrator.results.caRegistration).not.toBeNull();

  // Simulate IoT SDK Error
  AWSMock.remock('Iot', 'registerCACertificate', (_param: RegisterCACertificateRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var registrator = new CaRegistrator(event);
  registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  await registrator.getRegistrationCode();
  registrator.createCertificates();
  var result = await registrator.registerCa();
  expect(result).toBeUndefined();
  expect(registrator.results.caRegistration).toBeNull();
  expect(registrator.response.statusCode)
    .toBe(registrator.errorCodes.errorOfCaRegistration);
});