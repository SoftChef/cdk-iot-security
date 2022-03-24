import {
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import {
  Code,
  Function,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import {
  Bucket,
} from 'aws-cdk-lib/aws-s3';
import {
  App,
  Stack,
} from 'aws-cdk-lib/core';
import { JustInTimeRegistration } from '../..';

const app = new App();
const id = 'JitrDemo';
const stack = new Stack(app, id);
const jitr = new JustInTimeRegistration(stack, id, {
  vault: {
    bucket: new Bucket(stack, 'myVault'),
  },
  verifiers: [
    new Function(stack, 'myVerifier', {
      code: Code.fromInline('exports.handler = async (event) => { return JSON.stringify({ verified: event? true : false }); }'),
      handler: 'handler',
      runtime: Runtime.NODEJS_12_X,
    }),
  ],
});
const api = new RestApi(stack, id);
api.root.addResource('caRegister').addMethod('POST', new LambdaIntegration(jitr.caRegistrator));
api.root.addResource('verifiersFetch').addMethod('GET', new LambdaIntegration(jitr.verifiersFetcher));