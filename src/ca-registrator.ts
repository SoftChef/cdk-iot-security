import * as path from 'path';
import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { Construct, Duration } from '@aws-cdk/core';
import { VerifierRecorder } from './verifier-recorder';

export module CaRegistrationFunction {
  export interface CaRegistrationFunctionProps {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    /**
     * The verifiers to verify the client certificates.
     */
    readonly verifiers?: VerifierRecorder.VerifierProps[];
  }

  export interface VaultProps {
    /**
     * The S3 bucket
     */
    readonly bucket: Bucket;
    /**
     * The specified prefix to save the file.
     */
    readonly prefix: string;
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
    super(scope, `CaRegistrationFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/ca-registrator')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      timeout: Duration.seconds(10),
      memorySize: 256,
    });
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix);
    props.verifiers?.forEach(verifier => {
      this.addEnvironment(verifier.name, verifier.lambdaFunction.functionArn);
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