import * as path from 'path';
import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { Construct, Duration } from '@aws-cdk/core';
import { DeviceActivator } from './device-activator';

export module CaRegistrationFunction {
  export interface CaRegistrationFunctionProps {
    /**
     * The AWS SQS Queue collecting the MQTT messages sending
     * from the CA-associated Iot Rule, which sends a message
     * every time a client register its certificate.
     */
    deviceActivatorQueue: DeviceActivator.Queue;
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    vault: VaultProps;
    /**
     * The verifiers to verify the client certificates.
     */
    verifiers?: [VerifierProps];
  }

  export interface VaultProps {
    /**
     * The S3 bucket
     */
    bucket: Bucket;
    /**
     * The specified prefix to save the file.
     */
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
    lambdaFunction: lambda.Function;
  }
}

export class CaRegistrationFunction extends lambda.Function {
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: CaRegistrationFunction.CaRegistrationFunctionProps) {
    let environment: {[key: string]: string} = {
      DEIVCE_ACTIVATOR_ROLE_ARN: props.deviceActivatorQueue.pushingRole.roleArn,
      DEIVCE_ACTIVATOR_QUEUE_URL: props.deviceActivatorQueue.queueUrl,
      BUCKET_NAME: props.vault.bucket.bucketName,
      BUCKET_PREFIX: props.vault.prefix,
    };
    props.verifiers?.forEach(verifier => environment[verifier.name] = verifier.lambdaFunction.functionArn);

    super(scope, `CaRegistrationFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/ca-registrator')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: environment,
    });
    this.role?.attachInlinePolicy(
      new Policy(this, `CaRegistrationFunction-${id}`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iam:PassRole',
              'iot:RegisterCACertificate',
              'iot:GetRegistrationCode',
              'iot:CreateTopicRule',
            ],
            resources: ['*'],
          }),
        ],
      }),
    );
    props.vault.bucket.grantWrite(this);
  }
}