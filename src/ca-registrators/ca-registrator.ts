import * as path from 'path';
import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { Construct, Duration } from '@aws-cdk/core';
import { DeviceActivator } from '../device-activator';
import { strict as assert } from 'assert';

export class CaRegistrationFunction extends lambda.Function {
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: CaRegistrationFunction.Props) {
    super(scope, `CaRegistrationFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../../lambda-assets/ca-registrator')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      timeout: Duration.seconds(10),
      memorySize: 256,
    });    
    const jitp: boolean = props.jitp || false;
    const vault: CaRegistrationFunction.VaultProps = props.vault;
    const deviceActivatorQueue: DeviceActivator.Queue | undefined = props.deviceActivatorQueue;
    const verifiers: CaRegistrationFunction.VerifierProps[] = props.verifiers || [];
    this.addEnvironment('JITP', jitp? 'true' : 'false');
    this.addEnvironment('BUCKET_NAME', vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', vault.prefix);
    if (!jitp) {
      assert(deviceActivatorQueue instanceof DeviceActivator.Queue);
      this.addEnvironment('DEIVCE_ACTIVATOR_ROLE_ARN', deviceActivatorQueue.pushingRole.roleArn);
      this.addEnvironment('DEIVCE_ACTIVATOR_QUEUE_URL', deviceActivatorQueue.queueUrl);
      verifiers?.forEach(verifier => {
        this.addEnvironment(verifier.name, verifier.lambdaFunction.functionArn);
      });
    }
    this.role?.attachInlinePolicy(new Policy(this, `CaRegistrationFunction-${id}`, {
      statements: [new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'iam:PassRole',
          'iot:RegisterCACertificate',
          'iot:GetRegistrationCode',
          'iot:CreateTopicRule',
          'iot:TagResource',
        ],
        resources: ['*'],
      })],
    }));
    props.vault.bucket.grantWrite(this);
  }
}

export module CaRegistrationFunction {
  export interface Props {
    /**
     * The AWS SQS Queue collecting the MQTT messages sending
     * from the CA-associated Iot Rule, which sends a message
     * every time a client register its certificate.
     */
    deviceActivatorQueue?: DeviceActivator.Queue;
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    vault: VaultProps;
    /**
     * The verifiers to verify the client certificates.
     */
    verifiers?: [VerifierProps];
    jitp?: boolean;
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