import * as path from 'path';
import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import { Function } from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Bucket } from '@aws-cdk/aws-s3';
import { Construct, Duration } from '@aws-cdk/core';
import { DeviceActivatorQueue } from './device-activator';

export interface CaRegistrationFunctionProps {
  deviceActivatorQueue: DeviceActivatorQueue;
  vault: VaultProps;
  verifiers?: [VerifierProps];
}

export interface VaultProps {
  bucket: Bucket;
  prefix: string;
}

export interface VerifierProps {
  /**
   * The verifier name.
   */
  name: string;
  /**
   * The verifier Lambda Function
   */
  lambdaFunction: Function;
}

export class CaRegistrationFunction extends NodejsFunction {
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: CaRegistrationFunctionProps) {
    let environment: {[key: string]: string} = {
      DEIVCE_ACTIVATOR_ROLE_ARN: props.deviceActivatorQueue.pushingRole.roleArn,
      DEIVCE_ACTIVATOR_QUEUE_URL: props.deviceActivatorQueue.queueUrl,
      BUCKET_NAME: props.vault.bucket.bucketName,
      BUCKET_PREFIX: props.vault.prefix,
    };
    props.verifiers?.forEach(verifier => environment[verifier.name] = verifier.lambdaFunction.functionArn);

    super(scope, `CaRegistrationFunction-${id}`, {
      entry: path.resolve(__dirname, './lambda-assets/ca-registrator/app.js'),
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: environment,
    });
    this.role?.attachInlinePolicy(new Policy(this, `CaRegistrationFunction-${id}`, {
      statements: [new PolicyStatement({
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
      })],
    }));
  }
}

// class CaRegistationRole extends Role {
//   /**
//    * Initialize the CA Registration Role granted the neccessary
//    * permission to register CA and create IoT Rule.
//    * @param scope
//    * @param id
//    */
//   constructor(scope: Construct, id:string) {
//     super(scope, `CaRegistrationRole-${id}`, {
//       roleName: `CaRegistrationRoleName-${id}`,
//       assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
//       managedPolicies: [
//         ManagedPolicy.fromAwsManagedPolicyName(
//           'service-role/AWSLambdaBasicExecutionRole'),
//       ],
//     });
//     this.addToPolicy(new PolicyStatement({
//       effect: Effect.ALLOW,
//       actions: [
//         'iam:PassRole',
//         'iam:CreateRole',
//         'iam:AttachRolePolicy',
//         'iot:RegisterCACertificate',
//         'iot:TagResource',
//         'iot:GetRegistrationCode',
//         'iot:CreateTopicRule',
//       ],
//       resources: ['*'],
//     }));
//   }
// }