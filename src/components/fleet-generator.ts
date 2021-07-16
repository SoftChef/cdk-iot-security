import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { GreenGrassV2TokenExchangeRole } from './greengrass-v2';
import { FleetProvisionRole } from './provision-role';
import { VaultProps } from './vault';

export module FleetGenerator {
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    /**
     * The Role for Fleet Provision.
     */
    readonly fleetProvisionRole: FleetProvisionRole;
    readonly greengrassV2TokenExchangeRole?: GreenGrassV2TokenExchangeRole;
  }
}

export class FleetGenerator extends NodejsFunction {
  constructor(scope: cdk.Construct, id: string, props: FleetGenerator.Props) {
    super(scope, `FleetGenerator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/fleet-generator/app.ts`,
    });
    this.addEnvironment('GREENGRASS_V2_TOKEN_EXCHANGE_ROLE_ARN', props.greengrassV2TokenExchangeRole?.roleArn ?? '');
    this.addEnvironment('PROVISIONING_ROLE_ARN', props.fleetProvisionRole.roleArn);
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