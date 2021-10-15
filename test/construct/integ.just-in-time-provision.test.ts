import * as path from 'path';
import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import * as lambda from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { App, Stack } from '@aws-cdk/core';
import { JustInTimeProvision } from '../../src';


const expectedResources: {
  [name: string]: string;
} = {
  caRegistratorPolicy: 'JustInTimeProvisiontestcaseCaRegistratortestcase21FFC435',
  caRegistratorRole: 'JustInTimeProvisiontestcaseCaRegistratortestcaseServiceRoleFB1CB993',
  caRegistrator: 'JustInTimeProvisiontestcaseCaRegistratortestcase93903A27',
  provisionRole: 'JustInTimeProvisiontestcaseProvisionRoleRegistrationConfigRoletestcaseE8C566C2',
  deviceCertificateGenerator: 'JustInTimeProvisiontestcaseDeviceCertificateGeneratortestcase625C5945',
  deviceCertificateGeneratorPolicy: 'JustInTimeProvisiontestcaseDeviceCertificateGeneratortestcasePolicyDeviceCertificateGeneratortestcaseD0261C2C',
  deviceCertificateGeneratorRole: 'JustInTimeProvisiontestcaseDeviceCertificateGeneratortestcaseServiceRoleCA89F5E4',
  verifiersFetcher: 'JustInTimeProvisiontestcaseVerifiersFetchertestcase669A84BA',
  verifiersFetcherRole: 'JustInTimeProvisiontestcaseVerifiersFetchertestcaseServiceRole9B13C41F',
};

const expected: {
  [name: string]: string;
} = {
  lambdaFunctionRuntime: lambda.Runtime.NODEJS_14_X.toString(),
  vault: 'another-stack:ExportsOutputRefcaBucketD1A50B2B031F53FA',
};

describe('Integration test', () => {
  test('JustInTimeProvision', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const caBucket = new Bucket(anotherStack, 'caBucket');
    new JustInTimeProvision(stack, name, {
      vault: {
        bucket: caBucket,
        prefix: 'test',
      },
    });
    expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
    expect(stack).toCountResources('AWS::Lambda::Function', 3);
    expect(stack).toCountResources('AWS::IAM::Role', 4);
    expect(stack).toCountResources('AWS::IAM::Policy', 4);

    expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          BUCKET_NAME: {
            'Fn::ImportValue': expected.vault,
          },
          BUCKET_PREFIX: 'test',
          REGISTRATION_CONFIG_ROLE_ARN: {
            'Fn::GetAtt': [
              expectedResources.provisionRole,
              'Arn',
            ],
          },
          VERIFIERS: '"[]"',
        },
      },
      MemorySize: 256,
      Role: {
        'Fn::GetAtt': [
          expectedResources.caRegistratorRole,
          'Arn',
        ],
      },
      Runtime: expected.lambdaFunctionRuntime,
      Timeout: 10,
    });

    expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          BUCKET_NAME: {
            'Fn::ImportValue': expected.vault,
          },
          BUCKET_PREFIX: 'test',
        },
      },
      Handler: 'index.handler',
      MemorySize: 256,
      Role: {
        'Fn::GetAtt': [
          expectedResources.deviceCertificateGeneratorRole,
          'Arn',
        ],
      },
      Runtime: expected.lambdaFunctionRuntime,
      Timeout: 10,
    });

    expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
          VERIFIERS: '"[]"',
        },
      },
      Handler: 'index.handler',
      Role: {
        'Fn::GetAtt': [
          expectedResources.verifiersFetcherRole,
          'Arn',
        ],
      },
      Runtime: expected.lambdaFunctionRuntime,
    });

    expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'iam:PassRole',
              'iot:RegisterCACertificate',
              'iot:GetRegistrationCode',
              'iot:CreateTopicRule',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: expectedResources.caRegistratorPolicy,
      Roles: [
        {
          Ref: expectedResources.caRegistratorRole,
        },
      ],
    });

    expect(stack).toHaveResourceLike('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'iot:DescribeThing',
              'iot:DeleteCertificate',
              'iot:DeleteThing',
              'iot:DescribeCACertificate',
              'iot:ListTagsForResource',
              'iot:DescribeEndpoint',
              'lambda:InvokeFunction',
              'lambda:InvokeAsync',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: expectedResources.deviceCertificateGeneratorPolicy,
      Roles: [
        {
          Ref: expectedResources.deviceCertificateGeneratorRole,
        },
      ],
    });

    expect(stack).toHaveResourceLike('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'iot.amazonaws.com',
            },
          },
        ],
        Version: '2012-10-17',
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              {
                Ref: 'AWS::Partition',
              },
              ':iam::aws:policy/service-role/AWSIoTThingsRegistration',
            ],
          ],
        },
      ],
      RoleName: 'ProvisionRoleName-RegistrationConfigRole-test-case',
    });
  });
});