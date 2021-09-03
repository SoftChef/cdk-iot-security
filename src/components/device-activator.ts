import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct } from '@aws-cdk/core';

/**
 * The NodeJS Lambda Function having the main functionality of activating the device certificate and provision the AWS IoT resources.
 */
export class DeviceActivator extends NodejsFunction {
  /**
   * Inistialize the Device Activator.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string) {
    super(scope, `DeviceActivator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/device-activator/app.ts`,
    });
    this.role!.attachInlinePolicy(
      new Policy(this, `Policy-${this.node.id}`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iot:DescribeCertificate',
              'iot:DescribeCACertificate',
              'iot:ListTagsForResource',
              'iot:CreateThing',
              'iot:CreatePolicy',
              'iot:AttachPolicy',
              'iot:AttachThingPrincipal',
              'iot:UpdateCertificate',
              'lambda:InvokeFunction',
              'lambda:InvokeAsync',
            ],
            resources: ['*'],
          }),
        ],
      }),
    );
  }
}