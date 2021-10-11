import {
  PolicyStatement,
  Effect,
  Policy,
} from '@aws-cdk/aws-iam';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { VaultProps } from './vault';

export module DeviceCertificateGenerator {
  /**
   * The properties to initialize the Device Certificate Generator.
   */
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
  }
}

/**
 * The NodeJS Lambda Function having the main functionality of generating a device certificate set authenticated by a registered CA.
 */
export class DeviceCertificateGenerator extends NodejsFunction {
  /**
   * Initialize the Device Certificate Generator.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: cdk.Construct, id:string, props: DeviceCertificateGenerator.Props) {
    super(scope, `DeviceCertificateGenerator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/device-certificate-generator/app.ts`,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });
    props.vault.bucket.grantRead(this);
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix || '');
    this.role!.attachInlinePolicy(
      new Policy(this, `Policy-${this.node.id}`, {
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
              'iot:DescribeThing',
              'iot:DeleteCertificate',
              'iot:DeleteThing',
              'iot:DescribeCACertificate',
              'iot:ListTagsForResource',
              'iot:DescribeEndpoint',
              'lambda:InvokeFunction',
              'lambda:InvokeAsync',
            ],
            resources: ['*'],
          }),
        ],
      }),
    );
  }
}