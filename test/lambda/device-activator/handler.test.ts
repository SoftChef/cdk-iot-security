import {
  DescribeCertificateCommand,
  UpdateCertificateCommand,
  IoTClient,
  CreateThingCommand,
  CreatePolicyCommand,
  AttachPolicyCommand,
} from '@aws-sdk/client-iot';
import {
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../../../lambda-assets/device-activator/app';
import {
  VerificationError,
  InputError,
  CertificateNotFoundError,
  PemParsingError,
} from '../../../lambda-assets/device-activator/errors';

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

const iotMock = mockClient(IoTClient);
const lambdaMock = mockClient(LambdaClient);

beforeEach(() => {
  iotMock.on(DescribeCertificateCommand).resolves({
    certificateDescription: {
      certificateId: 'test_certificate_id',
      certificateArn: 'arn:test_certificate_arn',
      certificatePem: '-----BEGIN CERTIFICATE-----MIID0TCCArmgAwIBAgIBATANBgkqhkiG9w0BAQUFADCBgjFJMEcGA1UEAxNANWM1Yjk3ZTRkYjEwNTRjOTBkOGU3Mzg2ZDI3MTU0ZmFjYmY3NzAwZTBiN2FiZDMzMWQ4MzliYWM4OGUxZjZhYzEJMAcGA1UEBhMAMQkwBwYDVQQIEwAxCTAHBgNVBAcTADEJMAcGA1UEChMAMQkwBwYDVQQLEwAwHhcNMjEwNjIxMTYwNzI5WhcNMjIwNjIxMTYwNzI5WjCBgjFJMEcGA1UEAxNANWM1Yjk3ZTRkYjEwNTRjOTBkOGU3Mzg2ZDI3MTU0ZmFjYmY3NzAwZTBiN2FiZDMzMWQ4MzliYWM4OGUxZjZhYzEJMAcGA1UEBhMAMQkwBwYDVQQIEwAxCTAHBgNVBAcTADEJMAcGA1UEChMAMQkwBwYDVQQLEwAwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDUtmSOWM8s0Htuqrxt/fXc17WBo5Ayc+sYi5w7X5OBYLXUooKWnErFaApt6htqZekjS0CLlpoksfZ2YqBMq2nqSiNG1h3LPp0GT/Vw130ABzt0pVZKNcxC4yThRcGCGyWg3mSLCO7B1pp+p3YXJINXb32JjJV0txrF9q4CGPi8ha51C0P21fddFe0+9mWJt0voIQY+MIi5JMixuoRwuDIjC+Lgy+4vakzPzlFcOF/YsCVKfLoy8EbjevAVQW3E/CGN5ah9l5bTd1FeKhR0iAzHorul4uYzzbGztrgavCvgTY/bL/XWUUFrClBPXGPgh76VhT0l0I4Im7PgzdQ/c2fhAgMBAAGjUDBOMAwGA1UdEwQFMAMBAf8wHQYDVR0OBBYEFD2MDQBJHdAacc3tztFxxakdXPFeMB8GA1UdIwQYMBaAFD2MDQBJHdAacc3tztFxxakdXPFeMA0GCSqGSIb3DQEBBQUAA4IBAQA4Ekvz8LOty05mcZXapgltzXXyVic1UVH01IO0Lesrch1YgiXcEZUQuoSN/5e/1I4iCFSA8hrcDF/CbST3uCbh48Hx9MjPYCzFdeoMChG57gqwLGY1Fsz3rApQPGl40I+7rFh6s2pEkdu7WXxgRTHXnA65iIyFG8BsYn04J+gSn9DVBZ0DKwVXDmTyxjKLtTTXCr30WZGVa+eQzUCik3Pmrkon/fyOGUwE/p3E1iSbgSMqqHxfGjUiy2GX9I+na+TpBTRHl2WxkwVvTYYOhmuygkpJDIHIn5XJw6R5Yhj3fM/2ntgPN26EyXCYwVt732qDti6p8ZsucackcYENT4ak-----END CERTIFICATE-----',
    },
  });
  lambdaMock.on(InvokeCommand).resolves({
    StatusCode: 200,
    Payload: new Uint8Array(
      Buffer.from(
        JSON.stringify({ body: { verified: true } }),
      ),
    ),
  });
  iotMock.on(CreateThingCommand).resolves({
    thingName: 'test_thing_name',
  });
  iotMock.on(CreatePolicyCommand).resolves({
    policyName: 'test_policy_name',
  });
  iotMock.on(AttachPolicyCommand).resolves({});
  iotMock.on(UpdateCertificateCommand).resolves({});
  process.env.AWS_REGION = 'local';
});

afterEach(() => {
  iotMock.reset();
  lambdaMock.reset();
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
  lambdaMock.on(InvokeCommand).resolves({
    StatusCode: 200,
    Payload: new Uint8Array(
      Buffer.from(
        JSON.stringify({ body: { verified: false } }),
      ),
    ),
  });
  await expect(handler({ Records: [record] })).rejects.toThrowError(VerificationError);
});

test('Fail to execute the handler with an empty event', async () => {
  await expect(handler()).rejects.toThrow();
});

test('Fail to set the client certificate active', async () => {
  iotMock.on(UpdateCertificateCommand).rejects(new Error());
  await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
});

test('Fail to parse the verifier response', async () => {
  lambdaMock.on(InvokeCommand).resolves({
    StatusCode: 200,
    Payload: new Uint8Array(
      Buffer.from(
        JSON.stringify({ body: { } }),
      ),
    ),
  });
  await expect(handler({ Records: [record] })).rejects.toThrowError(VerificationError);
});

test('Fail to invoke the verifier', async () => {
  lambdaMock.on(InvokeCommand).rejects(new Error());
  await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
});

test('Get empty return from the verifier', async () => {
  lambdaMock.on(InvokeCommand).resolves({});
  await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
});

test('Fail to query the client certificate information', async () => {
  iotMock.on(DescribeCertificateCommand).rejects(new Error());
  await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
});

test('Get Error Codes successfully', () => {
  expect(new VerificationError().code).toBe(VerificationError.code);
  expect(new InputError().code).toBe(InputError.code);
  expect(new PemParsingError().code).toBe(PemParsingError.code);
  expect(new CertificateNotFoundError().code).toBe(CertificateNotFoundError.code);
});

test('SDK found no such certificate exists', async () => {
  iotMock.on(DescribeCertificateCommand).resolves({});
  await expect(handler({ Records: [record] })).rejects.toThrowError(CertificateNotFoundError);
});
