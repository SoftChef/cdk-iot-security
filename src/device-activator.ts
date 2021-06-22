import * as path from 'path';
import {
  Role,
  PolicyStatement,
  Effect,
  ServicePrincipal,
  PolicyDocument,
  Policy,
} from '@aws-cdk/aws-iam';
// import * as lambda from '@aws-cdk/aws-lambda';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as sqs from '@aws-cdk/aws-sqs';
import { Construct } from '@aws-cdk/core';

// export module DeviceActivator {
// export class DeviceActivator extends Construct {
export class DeviceActivator extends Construct {
  /**
   * The Device Activation Function.
   */
  public function: DeviceActivator.Function;

  /**
   * The AWS SQS Queue collecting the messages received from the IoT rules.
   */
  public queue: DeviceActivator.Queue;

  /**
   * Initialize the Device Activator.
   *
   * The Device Activator is mainly consist of three parts,
   * a Lambda Function providing the Activation functionality,
   * a Receptor which is a SQS Queue receiving the messages
   * from the CA-associated Iot Rules created by the Registrator,
   * and a Role allowing pushing to the Receptor for granting the
   * Iot Rule through the Registrator.
   *
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id: string) {
    super(scope, `DeviceActivator-${id}`);
    this.queue = new DeviceActivator.Queue(this, id);
    this.function = new DeviceActivator.Function(this, id);
    this.queue.grantConsumeMessages(this.function);
    this.function.addEventSource(
      new SqsEventSource(this.queue, { batchSize: 1 }),
    );
  }
}

export module DeviceActivator {
  export class Function extends NodejsFunction {
    /**
     * Inistialize the Device Activator Function.
     * @param scope
     * @param id
     * @param props
     */
    constructor(scope: Construct, id: string) {
      super(scope, `DeviceActivatorFunction-${id}`, {
        // code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/device-activator')),
        entry: path.resolve(__dirname, '../lambda-assets/device-activator/app.ts'),
        // handler: 'app.handler',
        // runtime: lambda.Runtime.NODEJS_14_X,
      });
      this.role?.attachInlinePolicy(
        new Policy(this, `DeviceActivationFunctionPolicy-${id}`, {
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