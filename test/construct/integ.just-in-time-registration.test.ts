import * as path from 'path';
import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import {
  RestApi,
  AuthorizationType,
  IAuthorizer,
} from '@aws-cdk/aws-apigateway';
import { Function, InlineCode, Runtime } from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { App, Stack } from '@aws-cdk/core';
import {
  JustInTimeRegistration,
  LackOfAuthorizerError,
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
    verifiers: [{
      name: 'test_verifier',
      lambdaFunction: new Function(verifierStack, name, {
        code: new InlineCode('exports.handler = () => { return true; }'),
        runtime: Runtime.NODEJS_12_X,
        handler: 'index.js',
      }),
    }],
    upload: {
      bucket: bucket,
      prefix: 'test',
    },
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
  // expect(stack).toHaveResourceLike('AWS::IAM::Role', {
  //   RoleName: 'DeviceActivatorRoleName-' + name,
  // });
  expect(stack).toHaveResourceLike('AWS::IAM::Role', {
    RoleName: 'ReceptorPushRoleName-' + name,
  });
  expect(stack).toCountResources('AWS::SQS::Queue', 1);
});

test('CaRegisterApi integration test without specifying a verifier', () => {
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const name = 'test-case';
  const anotherStack = new Stack(app, 'another-stack');
  const bucket = new Bucket(anotherStack, 'userProvidedBucket');
  new JustInTimeRegistration(stack, name, {
    upload: {
      bucket: bucket,
      prefix: 'test',
    },
  });
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
});

test('CaRegisterApi integration test with a specified RestApi and the IAM Authrozation Type is specified', () => {
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const name = 'test-case';
  const anotherStack = new Stack(app, 'another-stack');
  const bucket = new Bucket(anotherStack, 'userProvidedBucket');
  const providedRestApi = new RestApi(stack, 'test-api');
  new JustInTimeRegistration(stack, name, {
    restApiConfig: {
      restApi: providedRestApi,
      authorizationType: AuthorizationType.IAM,
    },
    upload: {
      bucket: bucket,
      prefix: 'test',
    },
  });
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
});

test('CaRegisterApi integration test with a specified RestApi and the IAM Authrozation Type is specified', () => {
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const name = 'test-case';
  const anotherStack = new Stack(app, 'another-stack');
  const bucket = new Bucket(anotherStack, 'userProvidedBucket');
  const providedRestApi = new RestApi(stack, 'test-api');
  new JustInTimeRegistration(stack, name, {
    restApiConfig: {
      restApi: providedRestApi,
      authorizationType: AuthorizationType.IAM,
    },
    upload: {
      bucket: bucket,
      prefix: 'test',
    },
  });
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
});

test('Initialize CaRegisterApi with a Cognito-Authorized RestApi', () => {
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const name = 'test-case';
  const anotherStack = new Stack(app, 'another-stack');
  const bucket = new Bucket(anotherStack, 'userProvidedBucket');
  const providedRestApi = new RestApi(stack, 'test-api');
  const providedIAuthorizer: IAuthorizer = {
    authorizerId: 'authorizer_id',
    authorizationType: AuthorizationType.COGNITO,
  };
  new JustInTimeRegistration(stack, name, {
    restApiConfig: {
      restApi: providedRestApi,
      authorizationType: AuthorizationType.COGNITO,
      authorizer: providedIAuthorizer,
    },
    upload: {
      bucket: bucket,
      prefix: 'test',
    },
  });
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
});

test('Initialize CaRegisterApi with a Custom-Authorized RestApi', () => {
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const name = 'test-case';
  const anotherStack = new Stack(app, 'another-stack');
  const bucket = new Bucket(anotherStack, 'userProvidedBucket');
  const providedRestApi = new RestApi(stack, 'test-api');
  const providedIAuthorizer: IAuthorizer = {
    authorizerId: 'authorizer_id',
    authorizationType: AuthorizationType.CUSTOM,
  };
  new JustInTimeRegistration(stack, name, {
    restApiConfig: {
      restApi: providedRestApi,
      authorizationType: AuthorizationType.CUSTOM,
      authorizer: providedIAuthorizer,
    },
    upload: {
      bucket: bucket,
      prefix: 'test',
    },
  });
  expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
});

test('Initialize CaRegisterApi with a Cognito-Authorized RestApi but missing authorizer', () => {
  process.env.BASE_PATH = __dirname;
  process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
  const app = new App();
  const stack = new Stack(app, 'test-stack');
  const name = 'test-case';
  const anotherStack = new Stack(app, 'another-stack');
  const bucket = new Bucket(anotherStack, 'userProvidedBucket');
  const providedRestApi = new RestApi(stack, 'test-api');
  expect(() => {
    new JustInTimeRegistration(stack, name, {
      restApiConfig: {
        restApi: providedRestApi,
        authorizationType: AuthorizationType.COGNITO,
      },
      upload: {
        bucket: bucket,
        prefix: 'test',
      },
    });
  }).toThrowError(LackOfAuthorizerError);
});