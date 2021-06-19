import * as path from 'path';
import {
  Role,
  PolicyStatement,
  Effect,
  ServicePrincipal,
  PolicyDocument,
  Policy,
} from '@aws-cdk/aws-iam';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Queue } from '@aws-cdk/aws-sqs';
import { Construct } from '@aws-cdk/core';

export class DeviceActivator extends Construct {
  /**
   * The Device Activation Function.
   */
  public deviceActivationFunction: DeviceActivationFunction;

  /**
   * The AWS SQS Queue collecting the messages received from the IoT rules.
   */
  public deviceActivatorQueue: DeviceActivatorQueue;

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
    this.deviceActivatorQueue = new DeviceActivatorQueue(this, id);
    this.deviceActivationFunction = new DeviceActivationFunction(this, id);
    this.deviceActivatorQueue.grantConsumeMessages(this.deviceActivationFunction);
    this.deviceActivationFunction.addEventSource(
      new SqsEventSource(this.deviceActivatorQueue, { batchSize: 1 }),
    );
  }
}

export namespace DeviceActivator {

}

export class DeviceActivatorQueue extends Queue {
  public readonly pushingRole: DeviceActivatorQueue.PushingRole;
  /**
   * Initialize the SQS Queue receiving message from the CA-associated Iot Rules.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id: string) {
    super(scope, `DeviceActivatorQueue-${id}`, {});
    this.pushingRole = new DeviceActivatorQueue.PushingRole(this, 'iot.amazonaws.com');
  }
}

export namespace DeviceActivatorQueue {
  /**
   * The Role allowing pushing messages into a specific Device Activator Queue.
   */
  export class PushingRole extends Role {
    constructor(queue: DeviceActivatorQueue, principalName: string) {
      let id = queue.node.id.replace('DeviceActivatorQueue', 'DeviceActivatorQueuePushingRole');
      let roleName = queue.node.id.replace('DeviceActivatorQueue', 'DeviceActivatorQueuePushingRoleName');
      super(queue, id, {
        roleName: roleName,
        assumedBy: new ServicePrincipal(principalName),
        inlinePolicies: {
          SqsPushPolicy: new PolicyDocument({
            statements: [new PolicyStatement({
              actions: [
                'sqs:SendMessageBatch',
                'sqs:SendMessage',
              ],
              resources: [
                queue.queueArn,
              ],
            })],
          }),
        },
      });
    }
  }
}

class DeviceActivationFunction extends NodejsFunction {
  /**
   * Inistialize the Device Activator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string) {
    super(scope, `DeviceActivatorFunction-${id}`, {
      entry: path.resolve(__dirname, './lambda-assets/device-activator/app.js'),
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