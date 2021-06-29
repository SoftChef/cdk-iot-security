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
import { JustInTimeRegistration } from './just-in-time-registration';
import { ReviewReceptor } from './review-receptor';

export module CaRegistrator {
  export interface Props {
    /**
     * The AWS SQS Queue collecting the MQTT messages sending
     * from the CA-associated Iot Rule, which sends a message
     * every time a client register its certificate.
     */
    readonly reviewReceptor: ReviewReceptor;
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: JustInTimeRegistration.VaultProps;
    /**
     * The verifiers to verify the client certificates.
     */
    readonly verifiers?: [JustInTimeRegistration.VerifierProps];
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
    this.addEnvironment('DEIVCE_ACTIVATOR_ROLE_ARN', props.reviewReceptor.acceptionRole.roleArn);
    this.addEnvironment('DEIVCE_ACTIVATOR_QUEUE_URL', props.reviewReceptor.queueUrl);
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix);
    props.verifiers?.forEach(verifier => {
      this.addEnvironment(verifier.name, verifier.lambdaFunction.functionArn);
    });
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