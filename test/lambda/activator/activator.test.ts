
import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {
  DescribeCertificateRequest,
  DescribeCertificateResponse,
  UpdateCertificateRequest,
} from 'aws-sdk/clients/iot';
import { InvocationRequest, InvocationResponse } from 'aws-sdk/clients/lambda';
import { ClientActivator } from '../../../src/lambda-assets/activator/activator';

AWS.config.region = 'local';
AWSMock.setSDKInstance(AWS);
AWSMock.mock('Iot', 'describeCertificate', (param: DescribeCertificateRequest, callback: Function)=>{
  if (param.certificateId) {
    const response: DescribeCertificateResponse = {
      certificateDescription: {
        certificateId: param.certificateId,
      },
    };
    callback(null, response);
  } else {
    callback(new Error(), null);
  }
});
AWSMock.mock('Iot', 'updateCertificate', (_param: UpdateCertificateRequest, callback: Function)=>{
  callback(null, {});
});
AWSMock.mock('Lambda', 'invoke', (_param: InvocationRequest, callback: Function)=>{
  const body = JSON.stringify({ verified: true });
  const response: InvocationResponse = {
    StatusCode: 200,
    Payload: JSON.stringify({ body: body }),
  };
  callback(null, response);
});

const record = {
  messageId: '203de074-ecd4-4cec-b4d8-6e0c6e7d2661',
  receiptHandle: 'AQEBjGJIDKPxXMaxb+dcCkvjJU67GUa/ouPuQJmdQA9HiHQPpYNXa00flxf1w0RuvUGCx+b2pWR9tjvEK6ZBGtBi/lQ9iX4FhQi3LoWZSzv9ZRMHAIFcp7edFASqaMx8hYB+RXYBY5KChiHjVRzgVVS6N+EB/jSrKzp+ORw+9mrtaqqBgY6sVSiWK5yXjMXDsfuOIFnOxzX9+++X8lbz8xrOXiRJyPpibsyYnJx8PH/5ziEMvSaLCkD+A9VATFihE7B7CCi3whiLJBwCTV7+vDg55UGZQWWS3XtKTJ8HBmIu9tdhgAQREg/QQHyJ+htb005SOxAhirT/Qo0Sw20/hIME8h4Vmzpf5Mnb9LII9v4WVW3kKPy1KC9rtMu6NOjbcG1d3Sb7j4zNpej0VlIajaqhW1JPZIWUYftvh8IMEBA66cbdHJYHUS0wvrMHIRQMrTEj5KqBK8jCV9W9Rx5v2NXmSVOjflHfbxucAfDpDYs1U94=',
  body: '{"certificateRegistrationTimestamp":"1623723165331","awsAccountId":"123456789012","certificateStatus":"PENDING_ACTIVATION","timestamp":1623724243659,"caCertificateId":"WFI7fa9lstp3pWz0PjIMcmEJIvXi06PRSkb0gj4yiNGaa4Givn74ug1tUTH6ci1n","certificateId":"WFI7fa9lstp3pWz0PjIMcmEJIvXi06PRSkb0gj4yiNGaa4Givn74ug1tUTH6ci1n","verifierArn":"arn:aws:lambda:us-east-1:123456789012:function:test_verifier"}',
  attributes: {
    ApproximateReceiveCount: '1',
    SentTimestamp: '1623724243785',
    SenderId: 'AROARFFBCV27HPM24CHQH:CPS7WY5f',
    ApproximateFirstReceiveTimestamp: '1623724243791',
  },
  messageAttributes: {},
  md5OfBody: '3b04a1bc817ccda45598608b86ea1b19',
  eventSource: 'aws:sqs',
  eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:my-stack-dev-CaRegisterApitestClientActivatortestActivatorQueuetes-S2H6D9K5SVK9',
  awsRegion: 'us-east-1',
};

test('initialize ClientActivator', ()=>{
  let recordContent = JSON.parse(record.body);

  // record with verifier specified
  var activator = new ClientActivator(record);
  expect(activator.record).toMatchObject(recordContent);
  expect(activator.verifierArn).toBeDefined();
  expect(activator.verifierArn).toBe(recordContent.verifierArn);
  expect(activator.certificateId).toBeDefined();
  expect(activator.certificateId).toBe(recordContent.certificateId);
  expect(activator.verified).toBeFalsy();
  expect(activator.results.activation).toBeNull();
  expect(activator.results.clientCertificateInfo).toBeNull();
  expect(activator.results.verification).toBeNull();

  // record without specifying verifier
  delete recordContent.verifierArn;
  var recordWithoutVerifier = Object.assign({}, record, { body: JSON.stringify(recordContent) });
  var activator = new ClientActivator(recordWithoutVerifier);
  expect(activator.verified).toBeTruthy();
});

test('activate', async ()=>{
  var activator = new ClientActivator(record);
  activator.iot = new AWS.Iot();
  activator.lambda = new AWS.Lambda();
  var response = await activator.activate();
  expect(response).toBeDefined();
  expect(activator.results.activation).not.toBeNull();
  expect(activator.results.clientCertificateInfo).not.toBeNull();
  expect(activator.results.verification).not.toBeNull();

  var activator = new ClientActivator(record);
  activator.certificateId = null;
  activator.iot = new AWS.Iot();
  activator.lambda = new AWS.Lambda();
  var response = await activator.activate();
  expect(response).toBeDefined();
});

test('checkCertificateId', ()=>{
  // Success
  var activator = new ClientActivator(record);
  activator.checkCertificateId();
  expect(activator.response).toBeNull();

  // Failure
  let recordContent = JSON.parse(record.body);
  delete recordContent.certificateId;
  var recordWithoutCertificateId = Object.assign({}, record, { body: JSON.stringify(recordContent) });
  var activator = new ClientActivator(recordWithoutCertificateId);
  activator.checkCertificateId();
  expect(activator.response).not.toBeNull();
  expect(activator.response.statusCode)
    .toBe(activator.errorCodes.missingClientCertificateId);
});

test('getClientCertificateInfo', async ()=>{
  // Omit if already have response
  var activator = new ClientActivator(record);
  activator.response = true;
  var result = await activator.getClientCertificateInfo();
  expect(result).toBeUndefined();
  expect(activator.results.clientCertificateInfo).toBeNull();

  // Success
  var activator = new ClientActivator(record);
  activator.iot = new AWS.Iot();
  var result = await activator.getClientCertificateInfo();
  expect(result).toBeDefined();
  expect(activator.results.clientCertificateInfo).not.toBeNull();

  // Error
  let recordContent = JSON.parse(record.body);
  delete recordContent.certificateId;
  var recordWithoutCertificateId = Object.assign({}, record, { body: JSON.stringify(recordContent) });
  var activator = new ClientActivator(recordWithoutCertificateId);
  activator.iot = new AWS.Iot();
  var result = await activator.getClientCertificateInfo();
  expect(result).toBeUndefined();
  expect(activator.results.clientCertificateInfo).toBeNull();
  expect(activator.response.statusCode)
    .toBe(activator.errorCodes.errorOfCheckingClientCertificate);
});

test('verify', async ()=>{
  // Omit if already have response
  var activator = new ClientActivator(record);
  activator.response = true;
  var result = await activator.verify();
  expect(result).toBeUndefined();
  expect(activator.results.clientCertificateInfo).toBeNull();

  // Omit if no verifier ARN is specified
  let recordContent = JSON.parse(record.body);
  delete recordContent.verifierArn;
  var recordWithoutVerifier = Object.assign({}, record, { body: JSON.stringify(recordContent) });
  var activator = new ClientActivator(recordWithoutVerifier);
  var result = await activator.verify();
  expect(result).toBeUndefined();
  expect(activator.results.clientCertificateInfo).toBeNull();

  // Success
  var activator = new ClientActivator(record);
  activator.lambda = new AWS.Lambda();
  await activator.verify();
  expect(activator.verified).toBeTruthy();
  expect(activator.results.verification).not.toBeNull();

  // Fail to parse verifier response
  AWSMock.remock('Lambda', 'invoke', (_param: InvocationRequest, callback: Function)=>{
    const response: InvocationResponse = {
      StatusCode: 200,
      Payload: {},
    };
    callback(null, response);
  });
  var activator = new ClientActivator(record);
  activator.lambda = new AWS.Lambda();
  await activator.verify();
  expect(activator.response).toBeDefined();
  expect(activator.response.statusCode)
    .toBe(activator.errorCodes.errorOfParsingVerifyingResult);

  // Simulate SDK Error
  AWSMock.remock('Lambda', 'invoke', (_param: InvocationRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  var activator = new ClientActivator(record);
  activator.lambda = new AWS.Lambda();
  await activator.verify();
  expect(activator.response).toBeDefined();
  expect(activator.response.statusCode)
    .toBe(activator.errorCodes.errorOfInvokingVerifier);
});

test('updateCertificate', async ()=>{
  // Omit if already have response
  var activator = new ClientActivator(record);
  activator.response = true;
  var result = await activator.setActive();
  expect(result).toBeUndefined();
  expect(activator.results.clientCertificateInfo).toBeNull();

  // Omit if not verified
  var activator = new ClientActivator(record);
  activator.verified = false;
  var result = await activator.setActive();
  expect(result).toBeUndefined();
  expect(activator.results.clientCertificateInfo).toBeNull();

  // Success
  var activator = new ClientActivator(record);
  activator.iot = new AWS.Iot();
  activator.verified = true;
  var result = await activator.setActive();
  expect(result).toBeDefined();
  expect(activator.results.activation).not.toBeNull();
  expect(activator.results.activation).not.toBeUndefined();

  // Simulate SDK Error
  AWSMock.remock('Iot', 'updateCertificate', (_param: UpdateCertificateRequest, callback: Function)=>{
    callback(new Error, null);
  });
  var activator = new ClientActivator(record);
  activator.iot = new AWS.Iot();
  activator.verified = true;
  var result = await activator.setActive();
  expect(result).toBeUndefined();
  expect(activator.results.activation).toBeNull();
  expect(activator.response.statusCode)
    .toBe(activator.errorCodes.failedToActivate);
});