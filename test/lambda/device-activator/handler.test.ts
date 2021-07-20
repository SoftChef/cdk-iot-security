import {
  DescribeCertificateCommand,
  UpdateCertificateCommand,
  DescribeCACertificateCommand,
  ListTagsForResourceCommand,
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
  InformationNotFoundError,
} from '../../../lambda-assets/device-activator/errors';

const expected = {
  recordContent: {
    certificateRegistrationTimestamp: '1623723165331',
    awsAccountId: '123456789012',
    certificateStatus: 'PENDING_ACTIVATION',
    timestamp: 1623724243659,
    caCertificateId: 'WFI7fa9lstp3pWz0PjIMcmEJIvXi06PRSkb0gj4yiNGaa4Givn74ug1tUTH6ci1n',
    certificateId: 'WFI7fa9lstp3pWz0PjIMcmEJIvXi06PRSkb0gj4yiNGaa4Givn74ug1tUTH6ci1n',
  },
  certificateArn: 'arn:test_certificate_arn',
  caCertificateArn: 'arn:test_ca_certificate_arn',
  caVerifierTag: {
    Key: 'verifierName',
    Value: 'test_verifier',
  },
  deviceCertificates: {
    withoutCommonName: `-----BEGIN CERTIFICATE-----
MIIDjTCCAnWgAwIBAgIBADANBgkqhkiG9w0BAQsFADCBgjFJMEcGA1UEAxNANWM1
Yjk3ZTRkYjEwNTRjOTBkOGU3Mzg2ZDI3MTU0ZmFjYmY3NzAwZTBiN2FiZDMzMWQ4
MzliYWM4OGUxZjZhYzEJMAcGA1UEBhMAMQkwBwYDVQQIEwAxCTAHBgNVBAcTADEJ
MAcGA1UEChMAMQkwBwYDVQQLEwAwHhcNMjEwNzIwMDUzNDAzWhcNNDYwNzIwMDUz
NDAzWjBCMQkwBwYDVQQDEwAxCTAHBgNVBAYTADEJMAcGA1UECBMAMQkwBwYDVQQH
EwAxCTAHBgNVBAoTADEJMAcGA1UECxMAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A
MIIBCgKCAQEA0TVozcxyhk9GJPjKq9TyKjK6kwZ9M8k5D4Rmr3nuSATEyxTL5uKz
1OZ/+Ylf+vlWsvlhD2SPLvQqSIJSCnPbFTZprompXZZpObZkEY0CbnwmXgdW3y7N
/PTLgr3uwYPT0DcJh5adoHPkxMlTIsRQ04kQnrzfuq84Yxu0gbtPrCIyLFiwDaEc
xIlMsSNBY41WivIV7lq+Hl0ILJ22zJX9RMe8RP/ETEqPYe038ihGvAMWWsI/TVdL
grYAzwK0IWC4NMW1db1ETBNnXtG54m2ZwleXDamUvwY/YS5QZjIPLfKRqk18Qulz
3a0aOnXi5APLGBpyiK3ihS9yxB79VbEb4QIDAQABo00wSzAJBgNVHRMEAjAAMB0G
A1UdDgQWBBSIuIiSev5QdqeQnKqUnrXkqymcPDAfBgNVHSMEGDAWgBSIuIiSev5Q
dqeQnKqUnrXkqymcPDANBgkqhkiG9w0BAQsFAAOCAQEAnglo/lxIyQbMQd0DPAKS
d8z8mGSCMrfKEFCIU1y4TReUtM8/2ELAns8G2PUgkLp/GPJRoNUU+oLQukTIvL9K
ujdMrIbEo5OY+1N1yAVV3nVIg9nA44I1oTHSGvQs8cbIfQNj2lawpdogUrG+mjYS
RdNwF50ju8bvlTSHMjoV9fnJLki3bn7hP2Uv4crhup4DfDA+7b/eILm7+tkPjyiq
o1XOKlWwFKxuovLIySrwuZhgJIyxw8NXRLUmslSD43m4tMKvs1ru2i2HtjF2cB5l
4u7gSeJgDPOpjDm3RcvZetOXwUxd15s9sTq/0DYuy5ykV1DVvONXACXrgmK2B+uk
rg==
-----END CERTIFICATE-----`,
    withCommonName: `-----BEGIN CERTIFICATE-----
MIIDnDCCAoSgAwIBAgIBADANBgkqhkiG9w0BAQsFADCBgjFJMEcGA1UEAxNANWM1
Yjk3ZTRkYjEwNTRjOTBkOGU3Mzg2ZDI3MTU0ZmFjYmY3NzAwZTBiN2FiZDMzMWQ4
MzliYWM4OGUxZjZhYzEJMAcGA1UEBhMAMQkwBwYDVQQIEwAxCTAHBgNVBAcTADEJ
MAcGA1UEChMAMQkwBwYDVQQLEwAwHhcNMjEwNzIwMDU0OTEwWhcNNDYwNzIwMDU0
OTEwWjBRMRgwFgYDVQQDEw90ZXN0X3RoaW5nX25hbWUxCTAHBgNVBAYTADEJMAcG
A1UECBMAMQkwBwYDVQQHEwAxCTAHBgNVBAoTADEJMAcGA1UECxMAMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvxiELOHWpUTTb6OET/nl4f0/eNrpeuOg
EN4oIpzhe5a8jNl/H5CUFj7kV67VpeKAxvs54WOTZl1JB1it5EkxL0/N7Pwo7RPA
jtI15ShYAf2BDgLgC6q884l6IpcYmYoeA1+/beaCSxwko5FavKAu1RSImu+xjKs6
AeAllMSe9x4CJSaYyElTenWJLbhNnif+3wlZPiUTvOIszHzwv12Xm+RiCOgJuMjC
A76jLtgjYg9WyUAGTf97tmFfdf+Su9bUT5i3Suzs+LMmXS3dCKSzpOMV1+6XXKOT
96/aQGlK0nxVmsaVNCq3wDx2fCfBsWF0BiadBNjVbSVrQxvAb03CGwIDAQABo00w
SzAJBgNVHRMEAjAAMB0GA1UdDgQWBBSvjNhpSInnnLFHqt7C/BHRql9tMTAfBgNV
HSMEGDAWgBSvjNhpSInnnLFHqt7C/BHRql9tMTANBgkqhkiG9w0BAQsFAAOCAQEA
F3qY5R/LVZflGU0G3fMDM8KW2ei03rZhJFut6xQ/ARjfFAipVuUZ8n+i0HVxb2pf
yQDCkCxFyg7HiYi1pYF1By84K7kvGdOBlLwthg80/+Dop6nJ2SMryh8iNEZ5D6gn
LRVEargJKiEeQAk/En+aXulTJkR4nXSaUI3ilAN7sPY+mtfO9coTCMtNWxwbTFgT
gCN3K2/syvnibAIqug/gfODdP11+28y8Vl5amBbkzZwILQDAQ2S9ZBgNUTSQMtHo
MWrZpWw5+AqquN2H+imalQ25SjfRWgbG8fkXP0lctQXpSVoqB26av2B1jJ8+XTek
eGWeMgJ4mKHNjqEVjxl5vg==
-----END CERTIFICATE-----`,
  },
  thingName: 'test_thing_name',
  policyName: 'test_policy_name',
};

const record = {
  messageId: '203de074-ecd4-4cec-b4d8-6e0c6e7d2661',
  receiptHandle: 'AQEBjGJIDKPxXMaxb+dcCkvjJU67GUa/ouPuQJmdQA9HiHQPpYNXa00flxf1w0RuvUGCx+b2pWR9tjvEK6ZBGtBi/lQ9iX4FhQi3LoWZSzv9ZRMHAIFcp7edFASqaMx8hYB+RXYBY5KChiHjVRzgVVS6N+EB/jSrKzp+ORw+9mrtaqqBgY6sVSiWK5yXjMXDsfuOIFnOxzX9+++X8lbz8xrOXiRJyPpibsyYnJx8PH/5ziEMvSaLCkD+A9VATFihE7B7CCi3whiLJBwCTV7+vDg55UGZQWWS3XtKTJ8HBmIu9tdhgAQREg/QQHyJ+htb005SOxAhirT/Qo0Sw20/hIME8h4Vmzpf5Mnb9LII9v4WVW3kKPy1KC9rtMu6NOjbcG1d3Sb7j4zNpej0VlIajaqhW1JPZIWUYftvh8IMEBA66cbdHJYHUS0wvrMHIRQMrTEj5KqBK8jCV9W9Rx5v2NXmSVOjflHfbxucAfDpDYs1U94=',
  body: JSON.stringify(expected.recordContent),
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
  process.env.AWS_REGION = 'local';
  iotMock.on(DescribeCertificateCommand, {
    certificateId: expected.recordContent.certificateId,
  }).resolves({
    certificateDescription: {
      certificateId: expected.recordContent.certificateId,
      certificateArn: expected.certificateArn,
      caCertificateId: expected.recordContent.caCertificateId,
      certificatePem: expected.deviceCertificates.withCommonName,
    },
  });
  iotMock.on(DescribeCACertificateCommand, {
    certificateId: expected.recordContent.caCertificateId,
  }).resolves({
    certificateDescription: {
      certificateArn: expected.caCertificateArn,
    },
  });
  iotMock.on(ListTagsForResourceCommand, {
    resourceArn: expected.caCertificateArn,
  }).resolves({
    tags: [expected.caVerifierTag],
  });
  lambdaMock.on(InvokeCommand, {
    FunctionName: expected.caVerifierTag.Value,
  }).resolves({
    StatusCode: 200,
    Payload: new Uint8Array(
      Buffer.from(
        JSON.stringify({ body: { verified: true } }),
      ),
    ),
  });
  iotMock.on(CreateThingCommand).resolves({
    thingName: expected.thingName,
  });
  iotMock.on(CreatePolicyCommand).resolves({
    policyName: expected.policyName,
  });
  iotMock.on(AttachPolicyCommand).resolves({});
  iotMock.on(UpdateCertificateCommand).resolves({});
});

afterEach(() => {
  iotMock.reset();
  lambdaMock.reset();
});

describe('Sucessfully execute the handler', () => {
  test('On a regular event', async () => {
    var response = await handler({ Records: [record] });
    expect(response.statusCode).toBe(200);
  });

  test('On a device certificate without common name', async () => {
    iotMock.on(DescribeCertificateCommand, {
      certificateId: expected.recordContent.certificateId,
    }).resolves({
      certificateDescription: {
        certificateId: expected.recordContent.certificateId,
        certificateArn: expected.certificateArn,
        caCertificateId: expected.recordContent.caCertificateId,
        certificatePem: expected.deviceCertificates.withoutCommonName,
      },
    });
    var response = await handler({ Records: [record] });
    expect(response.statusCode).toBe(200);
  });

  test('On Ca specifying no verifier', async () => {
    iotMock.on(ListTagsForResourceCommand, {
      resourceArn: expected.caCertificateArn,
    }).resolves({
      tags: [],
    });
    var response = await handler({ Records: [record] });
    expect(response.statusCode).toBe(200);
  });

  test('But fail to be verified', async () => {
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
});

describe('Fail on the AWS SDK error returns', () => {
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

  test('Found no such certificate exists', async () => {
    iotMock.on(DescribeCertificateCommand).resolves({});
    await expect(handler({ Records: [record] })).rejects.toThrowError(InformationNotFoundError);
  });

  test('Found no CA certificate ARN returned', async () => {
    iotMock.on(DescribeCACertificateCommand).resolves({});
    await expect(handler({ Records: [record] })).rejects.toThrowError(InformationNotFoundError);
  });

  test('Found no tag array returned, even an empty array', async () => {
    iotMock.on(ListTagsForResourceCommand).resolves({});
    await expect(handler({ Records: [record] })).rejects.toThrowError(Error);
  });
});

test('Get Error Codes successfully', () => {
  expect(new VerificationError().code).toBe(VerificationError.code);
  expect(new InputError().code).toBe(InputError.code);
  expect(new InformationNotFoundError().code).toBe(InformationNotFoundError.code);
});
