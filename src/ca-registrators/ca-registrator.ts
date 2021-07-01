import * as path from 'path';
import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import {
  Construct,
  Duration,
} from '@aws-cdk/core';
import { VerifiersFetcher } from '../verifiers-fetcher';
import { VaultProps } from '../vault';

export module CaRegistrator {
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    /**
     * The verifiers to verify the client certificates.
     */
    readonly verifiers?: VerifiersFetcher.Verifier[];
    /**
     * The mode is JITP or not.
     */
    readonly jitp?: boolean;
  }
}
export class CaRegistrator extends lambda.Function {
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: CaRegistrator.Props) {
    super(scope, `CaRegistrator-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/ca-registrator')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      timeout: Duration.seconds(10),
      memorySize: 256,
    });
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix);
    this.addEnvironment('JITP', props.jitp? 'true' : 'false');
    this.addEnvironment('VERIFIERS', JSON.stringify(
      props.verifiers?.map(verifier => verifier.functionName) || '[]',
    ),
    );
    this.role!.attachInlinePolicy(
      new Policy(this, `CaRegistrator-${id}`, {
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
  }
}