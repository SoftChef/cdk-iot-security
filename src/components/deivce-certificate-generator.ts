import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { VaultProps } from '../vault';

export module DeviceCertificateGenerator {
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
  }
}

export class DeviceCertificateGenerator extends NodejsFunction {
  constructor(scope: cdk.Construct, id:string, props: DeviceCertificateGenerator.Props) {
    super(scope, `DeviceCertificateGenerator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/device-certificate-generator/app.ts`,
    });
    props.vault.bucket.grantRead(this);
    this.addEnvironment('BUCKET_NAME', props.vault.bucket.bucketName);
    this.addEnvironment('BUCKET_PREFIX', props.vault.prefix || '');
  }
}