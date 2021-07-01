import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { JustInTimeRegistration } from '../';

const app = new cdk.App();
const anotherStack = new cdk.Stack(app, 'anotherStack');
const myVault = new s3.Bucket(anotherStack, 'myVault');
const myVerifier = new lambda.Function(anotherStack, 'verifier1', {
  code: lambda.Code.fromInline('exports.handler = async (_event) => { return JSON.stringify({ verified: true }); }'),
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_12_X,
});

const id1 = 'JitrDemo1';
const stack1 = new cdk.Stack(app, id1);
const jitr1 = new JustInTimeRegistration(stack1, id1, {
  vault: {
    bucket: myVault,
  },
});
const api1 = new apigateway.RestApi(anotherStack, 'JitrDemo1', {
    restApiName: 'Jitr Demo 1'
});
api1.root.addResource('caRegister').addMethod('GET', new apigateway.LambdaIntegration(jitr1.caRegistrator));
api1.root.addResource('deviceActivate').addMethod('GET', new apigateway.LambdaIntegration(jitr1.deviceActivator));
api1.root.addResource('verifiersFetch').addMethod('GET', new apigateway.LambdaIntegration(jitr1.verifiersFetcher));

const id2 = 'JitrDemo2';
const stack2 = new cdk.Stack(app, id2);
const jitr2 = new JustInTimeRegistration(stack2, id2, {
  vault: {
    bucket: myVault,
    prefix: 'my/ca/path',
  },
});
const api2 = new apigateway.RestApi(anotherStack, 'JitrDemo2', {
    restApiName: 'Jitr Demo 2'
});
api2.root.addResource('caRegister').addMethod('GET', new apigateway.LambdaIntegration(jitr2.caRegistrator));
api2.root.addResource('deviceActivate').addMethod('GET', new apigateway.LambdaIntegration(jitr2.deviceActivator));
api2.root.addResource('verifiersFetch').addMethod('GET', new apigateway.LambdaIntegration(jitr2.verifiersFetcher));

const id3 = 'JitrDemo3';
const stack3 = new cdk.Stack(app, id3);
const jitr3 = new JustInTimeRegistration(stack3, id3, {
  vault: {
    bucket: new s3.Bucket(anotherStack, 'myVault2'),
  },
  verifiers: [
    myVerifier,
    new lambda.Function(anotherStack, 'verifier2', {
      code: lambda.Code.fromInline('exports.handler = async (event) => { return JSON.stringify({ verified: event? true : false }); }'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_12_X,
    }),
  ],
});
const api3 = new apigateway.RestApi(anotherStack, 'JitrDemo3', {
    restApiName: 'Jitr Demo 3'
});
api3.root.addResource('caRegister').addMethod('GET', new apigateway.LambdaIntegration(jitr3.caRegistrator));
api3.root.addResource('deviceActivate').addMethod('GET', new apigateway.LambdaIntegration(jitr3.deviceActivator));
api3.root.addResource('verifiersFetch').addMethod('GET', new apigateway.LambdaIntegration(jitr3.verifiersFetcher));