import * as apigateway from '@aws-cdk/aws-apigateway';
import { Bucket } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { JustInTimeProvision } from '..';

const app = new cdk.App();
const id = 'test';
const stack = new cdk.Stack(app, id);
const justInTimeProvision = new JustInTimeProvision(stack, id, {
  vault: {
    bucket: new Bucket(stack, 'myVault'),
  },
});
const restApi = new apigateway.RestApi(stack, 'testRestApi');
restApi.root
  .addResource('caRegister')
  .addMethod('POST', new apigateway.LambdaIntegration(justInTimeProvision.caRegistrator));
