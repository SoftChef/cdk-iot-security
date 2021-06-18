import * as path from 'path';
// import { LambdaIntegration, Resource } from '@aws-cdk/aws-apigateway';
import {
  Role, PolicyStatement, Effect,
  ServicePrincipal, /*PolicyDocument,*/ ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Function } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct, Duration } from '@aws-cdk/core';

export interface CaRegistratorProps {
  activatorFunction: Function;
  activatorRole: Role;
  activatorQueueUrl: string;
  // apiResource: Resource;
  verifiers?: [VerifierProps];
}

export interface VerifierProps {
  name: string;
  lambdaFunction: Function;
}

export class CaRegistrator extends NodejsFunction {
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: CaRegistratorProps) {
    let environment: {[key: string]: string} = {
      ACTIVATOR_ARN: props.activatorFunction.functionArn,
      ACTIVATOR_ROLE_ARN: props.activatorRole.roleArn,
      ACTIVATOR_QUEUE_URL: props.activatorQueueUrl,
    };
    props.verifiers?.forEach(
      verifier => environment[verifier.name] = verifier.lambdaFunction.functionArn);

    super(scope, `CaRegistratorFunction-${id}`, {
      entry: path.resolve(__dirname, './lambda-assets/registrator/index.js'),
      role: new CaRegistationRole(scope, id),
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: environment,
    });
  }
}

class CaRegistationRole extends Role {
  /**
   * Initialize the CA Registration Role granted the neccessary
   * permission to register CA and create IoT Rule.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id:string) {
    super(scope, `CaRegistrationRole-${id}`, {
      roleName: `CaRegistrationRoleName-${id}`,
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'),
      ],
    });
    this.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'iam:PassRole',
        'iam:CreateRole',
        'iam:AttachRolePolicy',
        'iot:RegisterCACertificate',
        'iot:TagResource',
        'iot:GetRegistrationCode',
        'iot:CreateTopicRule',
      ],
      resources: ['*'],
    }));
  }
}