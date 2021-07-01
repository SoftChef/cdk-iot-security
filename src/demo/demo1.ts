import * as apigateway from '@aws-cdk/aws-apigateway';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { JustInTimeRegistration } from '..';

/**
 * Demonstration of initializing the JustInTimeRegistration
 * construct with only providing the AWS S3 Bucket as the Vault.
 *
 * You can integrate the CA Registrator, handling the CA registration,
 * and the Verifier Fetcher, providing the verifier information,
 * to your own API.
 */

const app = new cdk.App();
const anotherStack = new cdk.Stack(app, 'anotherStack');
const myVault = new s3.Bucket(anotherStack, 'myVault');

const id = 'JitrDemo1';
const stack = new cdk.Stack(app, id);
const jitr = new JustInTimeRegistration(stack, id, {
  vault: {
    bucket: myVault,
  },
});
const api = new apigateway.RestApi(stack, id);
api.root.addResource('caRegister').addMethod('POST', new apigateway.LambdaIntegration(jitr.caRegistrator));
api.root.addResource('verifiersFetch').addMethod('GET', new apigateway.LambdaIntegration(jitr.verifiersFetcher));