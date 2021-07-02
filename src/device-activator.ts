import * as path from 'path';
import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
// import * as lambda from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct } from '@aws-cdk/core';

export class DeviceActivator extends NodejsFunction {
  /**
   * Inistialize the Device Activator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string) {
    super(scope, `DeviceActivator-${id}`, {
      entry: path.resolve(__dirname, '../lambda-assets/device-activator/app.ts'),
    });
    this.role!.attachInlinePolicy(
      new Policy(this, `Policy-${this.node.id}`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iot:DescribeCertificate',
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