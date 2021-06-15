import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import { CreateLogGroupRequest } from 'aws-sdk/clients/cloudwatchlogs';
import {
  GetRegistrationCodeResponse, GetRegistrationCodeRequest,
  RegisterCACertificateResponse, RegisterCACertificateRequest,
  CreateTopicRuleRequest,
} from 'aws-sdk/clients/iot';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
// import { handler } from '../../../src/lambda-assets/registrator/index';

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
AWSMock.mock('Iot', 'createTopicRule', (_param: CreateTopicRuleRequest, callback: Function)=>{
  callback(null, {});
});
AWSMock.mock('CloudWatchLogs', 'createLogGroup', (_param: CreateLogGroupRequest, callback: Function)=>{
  callback(null, {});
});
AWSMock.mock('S3', 'upload', (param: PutObjectRequest, callback: Function)=>{
  if (param.Bucket && param.Key && param.Body) {
    callback(null, {});
  } else {
    console.log(param);
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
process.env.ACTIVATOR_QUEUE_URL = 'activator_queue_url';
process.env.ACTIVATOR_ROLE_ARN = 'activator_role_arn';
process.env.test_verifier = event.body.verifier.arn;

test('registrator handler', async ()=>{

  // var response = await handler(event);
  // expect(response.statusCode).toBe(200);

  //   var registrator = new CaRegistrator(event);
  //   registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
  //   registrator.cloudwatchLogs = new AWS.CloudWatchLogs();
  //   registrator.s3 = new AWS.S3();
  //   var response = await registrator.register();
  //   expect(response).toBeDefined();
  //   expect(registrator.response.statusCode).toBe(200);

//   var registrator = new CaRegistrator(
//     Object.assign(event, { body: { bucket: null, key: null } }));
//   registrator.iot = new AWS.Iot({ apiVersion: '2015-05-28' });
//   registrator.cloudwatchLogs = new AWS.CloudWatchLogs();
//   registrator.s3 = new AWS.S3();
//   var response = await registrator.register();
//   expect(response).toBeDefined();
//   expect(response.statusCode).toBeDefined();
//   expect(registrator.response.statusCode).not.toBe(200);
});