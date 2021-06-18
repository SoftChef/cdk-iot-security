import * as path from 'path';
import {
  Role, PolicyStatement, Effect,
  ServicePrincipal, PolicyDocument, ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Queue } from '@aws-cdk/aws-sqs';
import { Construct } from '@aws-cdk/core';

export class DeviceActivator extends Construct {
  /**
   * The Device Activation Function.
   */
  public function: DeviceActivationFunction;
  /**
   * The Receptor-Pushing Role for assigning to the Iot Rules.
   */
  public queuePushingRole: Role;

  /**
   * The AWS SQS Queue collecting the messages received from the IoT rules.
   */
  public receptor: Receptor;

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
    this.receptor = new Receptor(this, id);
    const activationRole = new ActivationRole(this, id);
    this.receptor.grantConsumeMessages(activationRole);
    this.function = new DeviceActivationFunction(this, id, {
      deviceActivationRole: activationRole,
    });
    this.function.addEventSource(new SqsEventSource(this.receptor, {
      batchSize: 1,
    }));
    this.queuePushingRole = this.receptor.getPushRole('iot.amazonaws.com');
    this.receptor.grantSendMessages(this.queuePushingRole);
  }
}

class Receptor extends Queue {
  /**
   * Initialize the SQS Queue receiving message from the CA-associated Iot Rules.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id: string) {
    super(scope, `Receptor-${id}`, {});
  }
  public getPushRole(principalName: string) {
    let segs = this.node.id.split('-');
    let id = segs.slice(1).join('-');
    return new Role(this, `PushRole-${id}`, {
      roleName: `ReceptorPushRoleName-${id}`,
      assumedBy: new ServicePrincipal(principalName),
      inlinePolicies: {
        SqsPushPolicy: new PolicyDocument({
          statements: [new PolicyStatement({
            actions: [
              'sqs:SendMessageBatch',
              'sqs:SendMessage',
            ],
            resources: [
              this.queueArn,
            ],
          })],
        }),
      },
    });
  }
}

interface DeviceActivationFunctionProps {
  /**
   * The Role for the Device Activator to complete the device activation work flow.
   */
  deviceActivationRole: Role;
}

class DeviceActivationFunction extends NodejsFunction {
  /**
   * Inistialize the Device Activator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: DeviceActivationFunctionProps) {
    super(scope, `DeviceActivatorFunction-${id}`, {
      entry: path.resolve(__dirname, './lambda-assets/deviceActivator/index.js'),
      role: props.deviceActivationRole,
    });
  }
}

class ActivationRole extends Role {
  /**
   * Initialize the Device Activator Role which allows the activator
   * to invoke other Lambda Functions, especially the verifier,
   * and operate the device certificates.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id:string) {
    super(scope, `DeviceActivatorRole-${id}`, {
      roleName: `DeviceActivatorRoleName-${id}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        CaRegistrationPolicy: new PolicyDocument({
          statements: [new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iot:UpdateCertificate',
              'iot:DescribeCertificate',
              'lambda:InvokeFunction',
              'lambda:InvokeAsync',
            ],
            resources: ['*'],
          })],
        }),
      },
    });
  }
}