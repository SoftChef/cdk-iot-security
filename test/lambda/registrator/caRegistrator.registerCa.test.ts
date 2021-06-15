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

process.env.AWS_REGION = 'us-east-1';

test('registerCa', async ()=>{
  // Success
  var registrator = new CaRegistrator(event);
  registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  registrator.results = Object.assign(
    registrator.results, { registrationCode: 'registration_code' });
  registrator.createCertificates();
  var result = await registrator.registerCa();
  expect(result).toBeDefined();
  //expect(registrator.results.caRegistration).not.toBeNull();

  var registrator = new CaRegistrator(event);
  registrator.caConfig = null;
  registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  registrator.results = Object.assign(
    registrator.results, { registrationCode: 'registration_code' });
  registrator.createCertificates();
  var result = await registrator.registerCa();
  expect(result).toBeDefined();
});