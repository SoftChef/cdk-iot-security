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
  JustInTimeRegistration,
} from '../../src/just-in-time-registration';

test('CaRegisterApi integration test', () => {
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
  expect(stack).toHaveResourceLike('AWS::IAM::Role', {
    RoleName: 'ReviewAcceptionRoleName-' + name,
  });
  expect(stack).toCountResources('AWS::SQS::Queue', 1);
});

test('CaRegisterApi integration test without providing verifiers and prefix', () => {
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
    },
  });
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
  expect(stack).toCountResources('AWS::Lambda::Function', 3);
  expect(stack).toCountResources('AWS::IAM::Role', 4);
  expect(stack).toHaveResourceLike('AWS::IAM::Role', {
    RoleName: 'ReviewAcceptionRoleName-' + name,
  });
  expect(stack).toCountResources('AWS::SQS::Queue', 1);
});

test('CaRegisterApi integration test with no verifiers provided', () => {
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
  expect(stack).toCountResources('AWS::Lambda::Function', 3);
  expect(stack).toCountResources('AWS::IAM::Role', 4);
  expect(stack).toCountResources('AWS::SQS::Queue', 1);
});