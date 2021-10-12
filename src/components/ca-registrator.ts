import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import {
  Construct,
  Duration,
} from '@aws-cdk/core';
import {
  RegistrationConfigRole,
} from './provision-role';
import {
  VaultProps,
} from './vault';
import {
  VerifiersFetcher,
} from './verifiers-fetcher';

export module CaRegistrator {
  /**
   * The properties to initialize the CA Registrator.
   */
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
     * The Role for JITP.
     */
    readonly registrationConfigRole?: RegistrationConfigRole;
  }
}

/**
 * The NodeJS Lambda Function having the main functionality of registering a CA on AWS IoT.
 */
export class CaRegistrator extends NodejsFunction {
  /**
   * Initialize the CA Registrator.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: CaRegistrator.Props) {
    super(scope, `CaRegistrator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/ca-registrator/app.ts`,
      timeout: Duration.seconds(10),
      memorySize: 256,
    });
    props.vault.bucket.grantReadWrite(this);
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix || '');
    if (props.registrationConfigRole) {
      this.addEnvironment('REGISTRATION_CONFIG_ROLE_ARN', props.registrationConfigRole.roleArn);
    }
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
              'iot:TagResource',
            ],
            resources: ['*'],
          }),
        ],
      }),
    );
  }
}