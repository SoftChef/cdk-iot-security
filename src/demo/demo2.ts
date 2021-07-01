import * as apigateway from '@aws-cdk/aws-apigateway';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { JustInTimeRegistration } from '..';

/**
 * Demonstration of specifying the path to save the
 * generated CA data with the prefix parameter.
 */

const app = new cdk.App();
const anotherStack = new cdk.Stack(app, 'anotherStack');
const myVault = new s3.Bucket(anotherStack, 'myVault');

const id = 'JitrDemo2';
const stack = new cdk.Stack(app, id);
const jitr = new JustInTimeRegistration(stack, id, {
  vault: {
    bucket: myVault,
    prefix: 'my/ca/path',
  },
});
const api = new apigateway.RestApi(stack, id);
api.root.addResource('caRegister').addMethod('POST', new apigateway.LambdaIntegration(jitr.caRegistrator));
api.root.addResource('verifiersFetch').addMethod('GET', new apigateway.LambdaIntegration(jitr.verifiersFetcher));