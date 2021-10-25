import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { FleetProvisioningRole } from './provision-role';
import { VaultProps } from './vault';

export module FleetGenerator {
  /**
   * The properties to initialize the Fleet Generator.
   */
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    /**
     * The Role for Fleet Provision.
     */
    readonly fleetProvisionRole: FleetProvisioningRole;
    /**
     * Enable the Greengrass V2 mode.
     */
    readonly enableGreengrassV2Mode?: boolean;
  }
}

/**
 * The NodeJS Lambda Function having the main functionality of generating a fleet-provisioning template and a provision-claim certificate on AWS IoT.
 */
export class FleetGenerator extends NodejsFunction {
  /**
   * * Inistialize the Fleet Generator.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: cdk.Construct, id: string, props: FleetGenerator.Props) {
    super(scope, `FleetGenerator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/fleet-generator/app.ts`,
    });
    this.addEnvironment('FLEET_PROVISIONING_ROLE_ARN', props.fleetProvisionRole.roleArn);
    props.vault.bucket.grantReadWrite(this);
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix || '');
    if (props.enableGreengrassV2Mode) {
      this.addEnvironment('ENABLE_GREENGRASS_V2_MODE', 'true');
    }
    this.role!.attachInlinePolicy(
      new Policy(this, `FleetGenerator-${id}`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iam:PassRole',
              'iam:CreatePolicy',
              'iam:CreateRole',
              'iam:AttachRolePolicy',
              'iam:TagRole',
              'iot:CreateProvisioningTemplate',
              'iot:CreatePolicy',
              'iot:CreateKeysAndCertificate',
              'iot:AttachPolicy',
              'iot:CreateRoleAlias',
            ],
            resources: ['*'],
          }),
        ],
      }),
    );
  }
}