import * as path from 'path';
import {
  PolicyStatement,
  Effect,
  Policy,
  Role,
  ServicePrincipal,
  PolicyDocument
} from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import * as sqs from '@aws-cdk/aws-sqs';
import { Construct } from '@aws-cdk/core';

export class DeviceActivator extends lambda.Function {
  /**
   * Inistialize the Device Activator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string) {
    super(scope, `DeviceActivator-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/device-activator')),
      handler: 'app.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
    });
    this.role?.attachInlinePolicy(
      new Policy(this, `Policy-${this.node.id}`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iot:UpdateCertificate',
              'iot:DescribeCertificate',
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

export module DeviceActivator {

  export class Queue extends sqs.Queue {
    public readonly pushingRole: Queue.PushingRole;
    /**
     * Initialize the SQS Queue receiving message from the CA-associated Iot Rules.
     * @param scope
     * @param id
     */
    constructor(scope: Construct, id: string) {
      super(scope, `DeviceActivatorQueue-${id}`, {});
      this.pushingRole = new Queue.PushingRole(this, 'iot.amazonaws.com');
    }
  }
  export module Queue {
    /**
     * The Role allowing pushing messages into a specific Device Activator Queue.
     */
    export class PushingRole extends Role {
      constructor(queue: Queue, principalName: string) {
        let id = queue.node.id.replace('DeviceActivatorQueue', 'DeviceActivatorQueuePushingRole');
        let roleName = queue.node.id.replace('DeviceActivatorQueue', 'DeviceActivatorQueuePushingRoleName');
        super(queue, id, {
          roleName: roleName,
          assumedBy: new ServicePrincipal(principalName),
          inlinePolicies: {
            SqsPushPolicy: new PolicyDocument({
              statements: [
                new PolicyStatement({
                  actions: [
                    'sqs:SendMessageBatch',
                    'sqs:SendMessage',
                  ],
                  resources: [
                    queue.queueArn,
                  ],
                }),
              ],
            }),
          },
        });
      }
    }
  }
}