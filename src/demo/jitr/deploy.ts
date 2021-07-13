import * as apigateway from '@aws-cdk/aws-apigateway';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { JustInTimeRegistration } from '../..';

const app = new cdk.App();
const id = 'JitrDemo';
const stack = new cdk.Stack(app, id);
const myVerifier = new lambda.Function(stack, 'verifier', {
  code: lambda.Code.fromInline('exports.handler = async (_event) => { return JSON.stringify({ verified: true }); }'),
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_12_X,
});
const jitr = new JustInTimeRegistration(stack, id, {
  vault: {
    bucket: new s3.Bucket(stack, 'myVault'),
  },
  verifiers: [
    myVerifier,
    new lambda.Function(stack, 'verifier2', {
      code: lambda.Code.fromInline('exports.handler = async (event) => { return JSON.stringify({ verified: event? true : false }); }'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_12_X,
    }),
  ],
});
const api = new apigateway.RestApi(stack, id);
api.root.addResource('caRegister').addMethod('POST', new apigateway.LambdaIntegration(jitr.caRegistrator));
api.root.addResource('verifiersFetch').addMethod('GET', new apigateway.LambdaIntegration(jitr.verifiersFetcher));