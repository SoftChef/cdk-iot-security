
import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';
import {
  DescribeCertificateRequest,
  DescribeCertificateResponse,
  UpdateCertificateRequest,
} from 'aws-sdk/clients/iot';
import { InvocationRequest, InvocationResponse } from 'aws-sdk/clients/lambda';
import { handler } from '../../../src/lambda-assets/device-activator/app';
import {
  ParsingVerifyingResultError,
  MissingClientCertificateIdError,
} from '../../../src/lambda-assets/device-activator/errors';

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

beforeEach(() => {
  AWS.config.region = 'local';
  AWSMock.mock('Iot', 'describeCertificate', (param: DescribeCertificateRequest, callback: Function)=>{
    const response: DescribeCertificateResponse = {
      certificateDescription: {
        certificateId: param.certificateId,
      },
    };
    callback(null, response);
  });
  AWSMock.mock('Lambda', 'invoke', (_param: InvocationRequest, callback: Function)=>{
    const body = JSON.stringify({ verified: true });
    const response: InvocationResponse = {
      StatusCode: 200,
      Payload: JSON.stringify({ body: body }),
    };
    callback(null, response);
  });
  AWSMock.mock('Iot', 'updateCertificate', (_param: UpdateCertificateRequest, callback: Function)=>{
    callback(null, {});
  });
});

afterEach(() => {
  AWSMock.restore();
});

test('Successfully execute the handler', async () => {
  var response = await handler({ Records: [record] });
  expect(response.statusCode).toBe(200);
});

test('Successfully execute the handler without specifying a verifier', async () => {
  let recordContent = JSON.parse(record.body);
  delete recordContent.verifierArn;
  var recordWithoutVerifier = Object.assign({}, record, { body: JSON.stringify(recordContent) });
  var response = await handler({ Records: [recordWithoutVerifier] });
  expect(response.statusCode).toBe(200);
});

test('Successfully execute the handler but fail to be verified', async () => {
  AWSMock.remock('Lambda', 'invoke', (_param: InvocationRequest, callback: Function)=>{
    const body = JSON.stringify({ verified: false });
    const response: InvocationResponse = {
      StatusCode: 200,
      Payload: JSON.stringify({ body: body }),
    };
    callback(null, response);
  });
  var response = await handler({ Records: [record] });
  expect(response.statusCode).toBe(200);
});

test('Fail to set the client certificate active', async () => {
  AWSMock.remock('Iot', 'updateCertificate', (_param: UpdateCertificateRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
});

test('Fail to parse the verifier response', async () => {
  AWSMock.remock('Lambda', 'invoke', (_param: InvocationRequest, callback: Function)=>{
    const body = JSON.stringify({});
    const response: InvocationResponse = {
      StatusCode: 200,
      Payload: JSON.stringify({ body: body }),
    };
    callback(null, response);
  });
  await expect(handler({ Records: [record] })).rejects.toThrowError(ParsingVerifyingResultError);
});

test('Fail to invoke the verifier', async () => {
  AWSMock.remock('Lambda', 'invoke', (_param: InvocationRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
});

test('Fail to query the client certificate information', async () => {
  AWSMock.remock('Iot', 'describeCertificate', (_param: DescribeCertificateRequest, callback: Function)=>{
    callback(new Error(), null);
  });
  await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
});

test('Missing the client certificate ID', async () => {
  let recordContent = JSON.parse(record.body);
  delete recordContent.certificateId;
  var recordWithoutCertificateId = Object.assign({}, { body: JSON.stringify(recordContent) });
  expect(JSON.parse(record.body).certificateId);

  await expect(handler({ Records: [recordWithoutCertificateId] })).rejects.toThrowError(MissingClientCertificateIdError);
});

test('Get Error Codes successfully', () => {
  expect(new MissingClientCertificateIdError().code)
    .toBe(MissingClientCertificateIdError.code);
  expect(new ParsingVerifyingResultError().code)
    .toBe(ParsingVerifyingResultError.code);
});
