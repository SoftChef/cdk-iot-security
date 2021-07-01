import * as path from 'path';
import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import {
  Function,
  InlineCode,
  Runtime,
} from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { App, Stack } from '@aws-cdk/core';
import {
  CaRegistrator,
  DeviceActivator,
  JitrCaRegistrator,
  JitpCaRegistrator,
  JustInTimeRegistration,
  JustInTimeProvision,
} from '../../src/index';

describe('Test index.ts importation', () => {
  test('Create Functions', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    const deviceActivator = new DeviceActivator(stack, 'testDeviceActivator');
    new CaRegistrator(stack, 'testCaRegistrationFunction', {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });
    new JitpCaRegistrator(stack, 'testJitpCaRegistrationFunction', {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });
    new JitrCaRegistrator(stack, 'testJitrCaRegistrationFunction', {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });
    expect(stack).toCountResources('AWS::Lambda::Function', 4);
  });
});

describe('Test JustInTimeRegistration', () => {
  test('integration test', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const verifierStack = new Stack(app, 'verifier-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new JustInTimeRegistration(stack, name, {
      verifiers: [{
        name: 'test_verifier',
        lambdaFunction: new Function(verifierStack, name, {
          code: new InlineCode('exports.handler = () => { return true; }'),
          runtime: Runtime.NODEJS_12_X,
          handler: 'index.js',
        }),
      }],
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });

    expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
    expect(stack).toCountResources('AWS::Lambda::Function', 2);
    expect(stack).toCountResources('AWS::IAM::Role', 3);
    expect(stack).toHaveResourceLike('AWS::IAM::Role', {
      RoleName: 'DeviceActivatorQueuePushingRoleName-' + name,
    });
    expect(stack).toCountResources('AWS::SQS::Queue', 1);
  });
  test('integration test without providing verifier', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new JustInTimeRegistration(stack, name, {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });

    expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
    expect(stack).toCountResources('AWS::Lambda::Function', 2);
    expect(stack).toCountResources('AWS::IAM::Role', 3);
    expect(stack).toHaveResourceLike('AWS::IAM::Role', {
      RoleName: 'DeviceActivatorQueuePushingRoleName-' + name,
    });
    expect(stack).toCountResources('AWS::SQS::Queue', 1);
  });
});

describe('Test JustInTimeProvision', () => {
  test('Integration test', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new JustInTimeProvision(stack, name, {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });

    expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
    expect(stack).toCountResources('AWS::Lambda::Function', 1);
    expect(stack).toCountResources('AWS::IAM::Role', 2);
  });
});