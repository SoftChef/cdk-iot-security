import * as path from 'path';
import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import { Function, InlineCode, Runtime } from '@aws-cdk/aws-lambda';
import { App, Stack } from '@aws-cdk/core';
import { JustInTimeRegistration } from '../../src/just-in-time-registration';

test('CaRegisterApi integration test', ()=>{
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  console.log(process.env.APPS_PATH);
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const verifierStack = new Stack(app, 'verifier-stack');
  const name = 'test-case';
  new JustInTimeRegistration(stack, name, {
    verifiers: [{
      name: 'test_verifier',
      lambdaFunction: new Function(verifierStack, name, {
        code: new InlineCode('exports.handler = () => { return true; }'),
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.js',
      }),
    }],
  });

  const expectedIds = {
    resource: {
      Ref: 'CaRegisterApitestcaseregister4C4AC1E7',
    },
    api: {
      Ref: 'CaRegisterApitestcaseFF571B6E',
    },
  };

  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
  expect(stack).toHaveResourceLike('AWS::ApiGateway::Resource', {
    PathPart: 'register',
    RestApiId: expectedIds.api,
  });
  expect(stack).toHaveResourceLike('AWS::ApiGateway::Method', {
    HttpMethod: 'POST',
    RestApiId: expectedIds.api,
    ResourceId: expectedIds.resource,
  });
  expect(stack).toCountResources('AWS::Lambda::Function', 2);
  expect(stack).toCountResources('AWS::IAM::Role', 4);
  expect(stack).toHaveResourceLike('AWS::IAM::Role', {
    RoleName: 'CaRegistrationRoleName-' + name,
  });
  expect(stack).toHaveResourceLike('AWS::IAM::Role', {
    RoleName: 'ActivatorRoleName-' + name,
  });
  expect(stack).toHaveResourceLike('AWS::IAM::Role', {
    RoleName: 'ReceptorPushRoleName-' + name,
  });
  expect(stack).toCountResources('AWS::SQS::Queue', 1);
});

test('CaRegisterApi integration test without specifying a verifier', ()=>{
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  console.log(process.env.APPS_PATH);
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const name = 'test-case';
  new JustInTimeRegistration(stack, name, {});
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
});