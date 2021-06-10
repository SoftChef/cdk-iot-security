import {
  Role, PolicyStatement, Effect,
  ServicePrincipal, PolicyDocument, ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Queue } from '@aws-cdk/aws-sqs';
import { Construct } from '@aws-cdk/core';

export class ClientActivator extends Construct {
  public function: ActivationFunction;
  public role: Role;
  public queue: Queue;
  constructor(scope: Construct, id: string) {
    super(scope, `ClientActivator-${id}`);
    this.role = new ActivationRole(this, id);
    this.queue = new Queue(this, `ActivatorQueue-${id}`);
    this.queue.grantConsumeMessages(this.role);
    this.queue.grantSendMessages(this.role);
    this.function = new ActivationFunction(this, id, {
      activationRole: this.role,
    });
    this.function.addEventSource(new SqsEventSource(this.queue));
  }
}

interface ActivationFunctionProps {
  activationRole: Role;
}

class ActivationFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: ActivationFunctionProps) {
    super(scope, `ActivatorFunction-${id}`, {
      entry: `${process.env.APPS_PATH}/activator/index.js`,
      role: props.activationRole,
    });
  }
}

class ActivationRole extends Role {
  constructor(scope: Construct, id:string) {
    super(scope, `ActivatorRole-${id}`, {
      roleName: `ActivatorRole-${id}`,
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
    this.assumeRolePolicy?.addStatements(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      principals: [new ServicePrincipal('iot.amazonaws.com')],
    }));
    this.grantPassRole(new ServicePrincipal('iot.amazonaws.com'));
  }
}