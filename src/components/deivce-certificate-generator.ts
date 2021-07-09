import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';
import { VaultProps } from '../vault';

export module DeviceCertificateGenerator {
  export interface Props {
    readonly vault: VaultProps;
  }
}

export class DeviceCertificateGenerator extends NodejsFunction {
  constructor(scope: cdk.Construct, id:string, porps: DeviceCertificateGenerator.Props) {
    super(scope, `DeviceCertificateGenerator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/device-certificate-generator/app.ts`,
    });
    porps.vault.bucket.grantRead(this);
  }
}