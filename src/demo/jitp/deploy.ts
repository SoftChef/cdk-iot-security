import {
  RestApi,
  LambdaIntegration,
} from 'aws-cdk-lib/aws-apigateway';
import {
  Bucket,
} from 'aws-cdk-lib/aws-s3';
import {
  App,
  Stack,
} from 'aws-cdk-lib/core';
import {
  JustInTimeProvision,
} from '../..';

const app = new App();
const id = 'JitpDemo';
const stack = new Stack(app, id);
const bucket = new Bucket(stack, 'myVault');
const justInTimeProvision = new JustInTimeProvision(stack, id, {
  vault: {
    bucket,
  },
});
const restApi = new RestApi(stack, 'testRestApi');
restApi.root
  .addResource('caRegister')
  .addMethod('POST', new LambdaIntegration(justInTimeProvision.caRegistrator));
restApi.root
  .addResource('verifiersFetch')
  .addMethod('GET', new LambdaIntegration(justInTimeProvision.verifiersFetcher));
restApi.root
  .addResource('deviceCertificateGenerate')
  .addMethod('POST', new LambdaIntegration(justInTimeProvision.deviceCertificateGenerator));
