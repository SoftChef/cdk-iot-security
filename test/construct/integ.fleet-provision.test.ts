import * as path from 'path';
import {
  App,
  Stack,
} from 'aws-cdk-lib';
import {
  Template,
} from 'aws-cdk-lib/assertions';
import {
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import {
  Bucket,
} from 'aws-cdk-lib/aws-s3';
import {
  FleetProvision,
} from '../../src';

const expectedResources: {
  [name: string]: string;
} = {
  provisoinRole: 'testcaseProvisionRoleFleetProvisioningRoletestcase678B85F8',
  fleetGeneratorRole: 'testcaseFleetGeneratortestcaseServiceRoleF1235FE0',
  fleetGeneratorPolicy: 'testcaseFleetGeneratortestcase5505B899',
  fleetGenerator: 'testcaseFleetGeneratortestcase12A380D3',
};

const expected: {
  [name: string]: string;
} = {
  lambdaFunctionRuntime: Runtime.NODEJS_14_X.toString(),
};

describe('Integration test', () => {

  test('FleetProvision', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new FleetProvision(stack, name, {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.resourceCountIs('AWS::IAM::Policy', 2);
    template.resourceCountIs('AWS::IAM::Role', 2);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Role: {
        'Fn::GetAtt': [
          expectedResources.fleetGeneratorRole,
          'Arn',
        ],
      },
      Environment: {
        Variables: {
          FLEET_PROVISIONING_ROLE_ARN: {
            'Fn::GetAtt': [
              expectedResources.provisoinRole,
              'Arn',
            ],
          },
        },
      },
      Runtime: expected.lambdaFunctionRuntime,
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: expectedResources.fleetGeneratorPolicy,
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'iam:PassRole',
              'iam:CreatePolicy',
              'iam:CreateRole',
              'iam:TagRole',
              'iot:CreateProvisioningTemplate',
              'iot:CreatePolicy',
              'iot:CreateKeysAndCertificate',
              'iot:AttachPolicy',
              'iot:CreateRoleAlias',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      Roles: [
        {
          Ref: expectedResources.fleetGeneratorRole,
        },
      ],
    });
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'ProvisionRoleName-FleetProvisioningRole-test-case',
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
    });
  });

  test('FleetProvision in Greengrass V2 mode', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new FleetProvision(stack, name, {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
      enableGreengrassV2Mode: true,
    });
    const template = Template.fromStack(stack);
    expect(template.toJSON()).toMatchSnapshot();
    template.resourceCountIs('AWS::Lambda::Function', 1);
    template.resourceCountIs('AWS::IAM::Policy', 2);
    template.resourceCountIs('AWS::IAM::Role', 2);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Role: {
        'Fn::GetAtt': [
          expectedResources.fleetGeneratorRole,
          'Arn',
        ],
      },
      Environment: {
        Variables: {
          FLEET_PROVISIONING_ROLE_ARN: {
            'Fn::GetAtt': [
              expectedResources.provisoinRole,
              'Arn',
            ],
          },
        },
      },
    });
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyName: expectedResources.fleetGeneratorPolicy,
      PolicyDocument: {
        Statement: [
          {
            Action: [
              'iam:PassRole',
              'iam:CreatePolicy',
              'iam:CreateRole',
              'iam:TagRole',
              'iot:CreateProvisioningTemplate',
              'iot:CreatePolicy',
              'iot:CreateKeysAndCertificate',
              'iot:AttachPolicy',
              'iot:CreateRoleAlias',
            ],
            Effect: 'Allow',
            Resource: '*',
          },
        ],
        Version: '2012-10-17',
      },
      Roles: [
        {
          Ref: expectedResources.fleetGeneratorRole,
        },
      ],
    });
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'ProvisionRoleName-FleetProvisioningRole-test-case',
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
    });
  });

});
