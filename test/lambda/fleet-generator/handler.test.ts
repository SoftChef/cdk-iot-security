import * as iam from '@aws-sdk/client-iam';
import {
  IoTClient,
  CreateProvisioningTemplateCommand,
  CreatePolicyCommand,
  CreateKeysAndCertificateCommand,
  AttachPolicyCommand,
  CreateRoleAliasCommand,
} from '@aws-sdk/client-iot';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import {
  InputError,
  TemplateBodyPolicyDocumentMalformed,
} from '../../../lambda-assets/errors';
import { handler } from '../../../lambda-assets/fleet-generator/app';
import defaultIotPolicy from '../../../lambda-assets/fleet-generator/default-iot-policy.json';
import defaultTemplateBody from '../../../lambda-assets/fleet-generator/default-template.json';
import defaultTokenExchangePolicyDocument from '../../../lambda-assets/fleet-generator/default-token-exchange-policy.json';

const iotMock = mockClient(IoTClient);
const s3Mock = mockClient(S3Client);
const iamMock = mockClient(iam.IAMClient);

const templateName = 'test_template_name';

const event = {
  body: {
    templateName,
  },
};

const expected = {
  bucketName: 'test_bucket_name',
  bucketPrefix: 'test_bucket_prefix',
  templateName: event.body.templateName,
  templateArn: 'arn:test_template',
  provisioningRoleArn: 'arn:provisioning_role',
  policyName: `ProvisioningClaimCertificatePolicy-${event.body.templateName}`,
  provisioningClaimCertificateArn: 'arn:provisioning_claim_certificate_arn',
  provisioningClaimCertificateKeyPair: {
    PrivateKey: 'provisioning_claim_certificate_private_key',
    PublicKey: 'provisioning_claim_certificate_public_key',
  },
  provisioningClaimCertificatePem: 'provisioning_claim_certificate_pem',
  provisioningClaimCertificateId: 'provisioning_claim_certificate_id',
  greengrassTokenExchangeRoleArn: 'arn:greengrass-v2-token-exachange-role-arn',
  greengrassTokenExchangeRole: {
    Arn: 'arn:greengrass-v2-token-exachange-role-arn',
    Path: '/',
    RoleName: 'greengrass-v2-token-exachange-role-name',
    RoleId: 'greengrass-v2-token-exachange-role-id',
    CreateDate: new Date(),
  },
  greengrassTokenExchangePolicyArn: 'arn:greengrass-v2-token-exachange-policy-arn',
  roleAlias: 'greengrass-v2-token-exachange-role-alias',
  roleAliasArn: 'arn:greengrass-v2-token-exachange-role-alias-arn',
};

beforeEach(() => {
  process.env.FLEET_PROVISIONING_ROLE_ARN = expected.provisioningRoleArn;
  process.env.BUCKET_NAME = expected.bucketName;
  process.env.BUCKET_PREFIX = expected.bucketPrefix;
  iotMock.on(CreateRoleAliasCommand, {
    roleArn: expected.greengrassTokenExchangeRoleArn,
  }).resolves({
    roleAlias: expected.roleAlias,
    roleAliasArn: expected.roleAliasArn,
  });
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
  iamMock.on(iam.CreatePolicyCommand).resolves({
    Policy: {
      Arn: expected.greengrassTokenExchangePolicyArn,
    },
  });
  iamMock.on(iam.CreateRoleCommand).resolves({
    Role: expected.greengrassTokenExchangeRole,
  });
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

  test('On Greengrass V2 mode', async () => {
    process.env.GREENGRASS_V2_TOKEN_EXCHANGE_ROLE_ARN = expected.greengrassTokenExchangeRoleArn;
    process.env.ENABLE_GREENGRASS_V2_MODE = 'true';
    var response = await handler(event);
    expect(response.statusCode).toBe(200);
  });

  test('With custom template body', async () => {
    const customTemplateBody = defaultTemplateBody;
    customTemplateBody.Resources.policy.Properties.PolicyDocument = JSON.stringify(defaultIotPolicy);
    const customTemplateBodyEvent = {
      body: {
        templateName,
        templateBody: customTemplateBody,
      },
    };
    var response = await handler(customTemplateBodyEvent);
    expect(response.statusCode).toBe(200);
  });

  test('With custom token exchange policy document', async () => {
    const customTokenExchangePolicyDocument = defaultTokenExchangePolicyDocument;
    const customTokenExchangePolicyDocumentEvent = {
      body: {
        templateName,
        tokenExchangePolicyDocument: customTokenExchangePolicyDocument,
      },
    };
    var response = await handler(customTokenExchangePolicyDocumentEvent);
    expect(response.statusCode).toBe(200);
  });

});

describe('Fail to execute the handler', () => {

  test('On empty event', async () => {
    var response = await handler();
    expect(response.statusCode).toBe(InputError.code);
  });

  test('On malformed policy document in custom template body', async () => {
    const customTemplateBodyWithMalformedPolicyDocument = defaultTemplateBody;
    customTemplateBodyWithMalformedPolicyDocument.Resources.policy.Properties.PolicyDocument = '{{';
    const customTemplateBodyEventWithMalformedPolicyDocument = {
      body: {
        templateName,
        templateBody: customTemplateBodyWithMalformedPolicyDocument,
      },
    };
    var response = await handler(customTemplateBodyEventWithMalformedPolicyDocument);
    expect(response.statusCode).toBe(TemplateBodyPolicyDocumentMalformed.code);
  });

});