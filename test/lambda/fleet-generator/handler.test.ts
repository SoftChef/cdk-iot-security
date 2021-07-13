import {
  IoTClient,
  CreateProvisioningTemplateCommand,
  CreatePolicyCommand,
  CreateKeysAndCertificateCommand,
  AttachPolicyCommand,
} from '@aws-sdk/client-iot';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import {
  InputError,
} from '../../../lambda-assets/errors';
import { handler } from '../../../lambda-assets/fleet-generator/app';

const iotMock = mockClient(IoTClient);
const s3Mock = mockClient(S3Client);

const event = {
  body: {
    templateName: 'test_template_name',
  },
};

const expected = {
  bucketName: 'test_bucket_name',
  bucketPrefix: 'test_bucket_prefix',
  templateName: event.body.templateName,
  templateArn: 'arn:test_template',
  provisioningRoleArn: 'arn:provisioning_role',
  policyName: `ProvisioningClaimCertificateliPolicy-${event.body.templateName}`,
  provisioningClaimCertificateArn: 'arn:provisioning_claim_certificate_arn',
  provisioningClaimCertificateKeyPair: {
    PrivateKey: 'provisioning_claim_certificate_private_key',
    PublicKey: 'provisioning_claim_certificate_public_key',
  },
  provisioningClaimCertificatePem: 'provisioning_claim_certificate_pem',
  provisioningClaimCertificateId: 'provisioning_claim_certificate_id',
};

beforeEach(() => {
  process.env.PROVISIONING_ROLE_ARN = expected.provisioningRoleArn;
  process.env.BUCKET_NAME = expected.bucketName;
  process.env.BUCKET_PREFIX = expected.bucketPrefix;
  iotMock.on(CreateProvisioningTemplateCommand, {
    templateName: expected.templateName,
    provisioningRoleArn: expected.provisioningRoleArn,
  }).resolves({
    templateName: expected.templateName,
    templateArn: expected.templateArn,
  });
  iotMock.on(CreatePolicyCommand, {
    policyName: expected.policyName,
  }).resolves({
    policyName: expected.policyName,
  });
  iotMock.on(CreateKeysAndCertificateCommand, {
    setAsActive: true,
  }).resolves({
    certificateArn: expected.provisioningClaimCertificateArn,
    keyPair: expected.provisioningClaimCertificateKeyPair,
    certificatePem: expected.provisioningClaimCertificatePem,
    certificateId: expected.provisioningClaimCertificateId,
  });
  iotMock.on(AttachPolicyCommand, {
    policyName: expected.policyName,
    target: expected.provisioningClaimCertificateArn,
  }).resolves({});
  s3Mock.on(PutObjectCommand).resolves({});
});

describe('Sucessfully execute the handler', () => {

  test('On regular event', async () => {
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('On no bucket prefix', async () => {
    process.env.BUCKET_PREFIX = '';
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

});

describe('Fail to execute the handler', () => {

  test('On empty event', async () => {
    var response = await handler();
    expect(response.statusCode).toBe(InputError.code);
  });

});