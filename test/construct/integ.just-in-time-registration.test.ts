import * as path from 'path';
import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import * as lambda from '@aws-cdk/aws-lambda';
import {
  Function,
  InlineCode,
  Runtime,
} from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { App, Stack } from '@aws-cdk/core';
import { JustInTimeRegistration } from '../../src';

const expectedResources: {
  [name: string]: string;
} = {
  caRegistrator: 'JustInTimeRegistrationtestcaseCaRegistratortestcase40DBE3A2',
  caRegistratorPolicy: 'JustInTimeRegistrationtestcaseCaRegistratortestcaseDE8814EE',
  caRegistratorRole: 'JustInTimeRegistrationtestcaseCaRegistratortestcaseServiceRole8F8171C3',
  deviceActivator: 'JustInTimeRegistrationtestcaseDeviceActivatortestcaseBE99699A',
  deviceActivatorPolicy: 'JustInTimeRegistrationtestcaseDeviceActivatortestcasePolicyDeviceActivatortestcaseE698297C',
  deviceActivatorRole: 'JustInTimeRegistrationtestcaseDeviceActivatortestcaseServiceRoleCD94255D',
  deviceActivatorSqsPolicy: 'JustInTimeRegistrationtestcaseDeviceActivatortestcaseServiceRoleDefaultPolicyD0151B2D',
  eventSourceMapping: 'JustInTimeRegistrationtestcaseDeviceActivatortestcaseSqsEventSourceteststackJustInTimeRegistrationtestcaseReviewReceptortestcase3523F08BEF2BA3A9',
  reviewReceptor: 'JustInTimeRegistrationtestcaseReviewReceptortestcaseAB8D5DFE',
  reviewAcceptionRole: 'JustInTimeRegistrationtestcaseReviewReceptortestcaseReviewAcceptionRoletestcaseA3AF3CD4',
  topicRule: 'JustInTimeRegistrationtestcaseReviewReceptortestcaseTopicRuletestcaseB619B96E',
  verifiersFetcher: 'JustInTimeRegistrationtestcaseVerifiersFetchertestcase4F2CFBBA',
  verifiersFetcherRole: 'JustInTimeRegistrationtestcaseVerifiersFetchertestcaseServiceRoleFE2AC6E2',
};

const expected: {
  [name: string]: string;
} = {
  lambdaFunctionRuntime: lambda.Runtime.NODEJS_14_X.toString(),
  verifier: 'verifier-stack:ExportsOutputReftestcase9BC7DE4DD4B50F74',
  vault: 'another-stack:ExportsOutputRefuserProvidedBucket2349EF2D343936C6',
};

describe('Integration test', () => {
  test('JustInTimeRegistration', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const verifierStack = new Stack(app, 'verifier-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new JustInTimeRegistration(stack, name, {
      verifiers: [
        new Function(verifierStack, name, {
          code: new InlineCode('exports.handler = () => { return true; }'),
          runtime: Runtime.NODEJS_12_X,
          handler: 'index.js',
        }),
      ],
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });
    expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
    expect(stack).toCountResources('AWS::Lambda::Function', 3);
    expect(stack).toCountResources('AWS::IAM::Role', 4);
    expect(stack).toCountResources('AWS::SQS::Queue', 1);

    expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          BUCKET_NAME: {
            'Fn::ImportValue': expected.vault,
          },
          BUCKET_PREFIX: 'test',
          VERIFIERS: {
            'Fn::Join': [
              '',
              [
                '["',
                {
                  'Fn::ImportValue': expected.verifier,
                },
                '"]',
              ],
            ],
          },
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
      Role: {
        'Fn::GetAtt': [
          expectedResources.deviceActivatorRole,
          'Arn',
        ],
      },
      Runtime: expected.lambdaFunctionRuntime,
    });

    expect(stack).toHaveResourceLike('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          VERIFIERS: {
            'Fn::Join': [
              '',
              [
                '["',
                {
                  'Fn::ImportValue': expected.verifier,
                },
                '"]',
              ],
            ],
          },
        },
      },
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
              'iot:DescribeCertificate',
              'iot:DescribeCACertificate',
              'iot:ListTagsForResource',
              'iot:CreateThing',
              'iot:CreatePolicy',
              'iot:AttachPolicy',
              'iot:AttachThingPrincipal',
              'iot:UpdateCertificate',
              'lambda:InvokeFunction',
              'lambda:InvokeAsync',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      PolicyName: expectedResources.deviceActivatorPolicy,
      Roles: [
        {
          Ref: expectedResources.deviceActivatorRole,
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
      Policies: [
        {
          PolicyDocument: {
            Statement: [
              {
                Action: [
                  'sqs:SendMessageBatch',
                  'sqs:SendMessage',
                ],
                Effect: 'Allow',
                Resource: {
                  'Fn::GetAtt': [
                    expectedResources.reviewReceptor,
                    'Arn',
                  ],
                },
              },
            ],
            Version: '2012-10-17',
          },
          PolicyName: 'SqsPushPolicy',
        },
      ],
      RoleName: 'ReviewAcceptionRoleName-test-case',
    });

    expect(stack).toHaveResourceLike('AWS::IoT::TopicRule', {
      TopicRulePayload: {
        Actions: [
          {
            Sqs: {
              QueueUrl: {
                Ref: expectedResources.reviewReceptor,
              },
              RoleArn: {
                'Fn::GetAtt': [
                  expectedResources.reviewAcceptionRole,
                  'Arn',
                ],
              },
            },
          },
        ],
        Sql: "SELECT * FROM '$aws/events/certificates/registered/#'",
      },
    });
  });
});