import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { VaultProps } from './vault';

export module FleetGenerator {
  export interface Props {
    readonly vault: VaultProps;
  }
}

export class FleetGenerator extends NodejsFunction {
  constructor(scope: cdk.Construct, id: string, props: FleetGenerator.Props) {
    super(scope, `FleetGenerator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/fleet-generator/app.ts`,
    });
    props.vault.bucket.grantReadWrite(this);
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix || '');
    this.role!.attachInlinePolicy(
      new Policy(this, `CaRegistrator-${id}`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iam:PassRole',
              'iot:CreateProvisioningTemplate',
              'iot:CreatePolicy',
              'iot:CreateKeysAndCertificate',
              'iot:AttachPolicy',
            ],
            resources: ['*'],
          }),
        ],
      }),
    );
  }
}