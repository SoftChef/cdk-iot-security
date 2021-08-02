import * as apigateway from '@aws-cdk/aws-apigateway';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import { FleetProvision } from '../../..';

const app = new cdk.App();
const id = 'FleetProvisionDemo';
const stack = new cdk.Stack(app, id);
const vault = new s3.Bucket(stack, 'myVault');
const fleetProvision = new FleetProvision(stack, id, {
  vault: {
    bucket: vault,
  },
  greengrassV2: true,
});
const restApi = new apigateway.RestApi(stack, 'testRestApi');
restApi.root
  .addResource('fleetGenerator')
  .addMethod('POST', new apigateway.LambdaIntegration(fleetProvision.fleetGenerator));