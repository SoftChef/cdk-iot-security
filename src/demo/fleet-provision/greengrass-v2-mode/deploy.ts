import {
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';
import {
  Bucket,
} from 'aws-cdk-lib/aws-s3';
import {
  App,
  Stack,
} from 'aws-cdk-lib/core';
import {
  FleetProvision,
} from '../../..';

const app = new App();
const id = 'FleetProvisionDemo';
const stack = new Stack(app, id);
const vault = new Bucket(stack, 'myVault');
const fleetProvision = new FleetProvision(stack, id, {
  vault: {
    bucket: vault,
  },
  enableGreengrassV2Mode: true,
});
const restApi = new RestApi(stack, 'testRestApi');
restApi.root
  .addResource('fleetGenerator')
  .addMethod('POST', new LambdaIntegration(fleetProvision.fleetGenerator));