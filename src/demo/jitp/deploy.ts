import * as apigateway from '@aws-cdk/aws-apigateway';
import { Bucket } from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { JustInTimeProvision } from '../..';

const app = new cdk.App();
const id = 'JitpDemo';
const stack = new cdk.Stack(app, id);
const bucket = new Bucket(stack, 'myVault');
const justInTimeProvision = new JustInTimeProvision(stack, id, {
  vault: {
    bucket,
  },
  deviceVault: {
    bucket,
  },
});
const restApi = new apigateway.RestApi(stack, 'testRestApi');
restApi.root
  .addResource('caRegister')
  .addMethod('POST', new apigateway.LambdaIntegration(justInTimeProvision.caRegistrator));
restApi.root
  .addResource('verifiersFetch')
  .addMethod('GET', new apigateway.LambdaIntegration(justInTimeProvision.verifiersFetcher));
restApi.root
  .addResource('deviceCertificateGenerate')
  .addMethod('POST', new apigateway.LambdaIntegration(justInTimeProvision.deviceCertificateGenerator));
