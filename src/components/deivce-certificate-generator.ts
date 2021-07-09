import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';

export class DeviceCertificateGenerator extends NodejsFunction {
  constructor(scope: cdk.Construct, id:string) {
    super(scope, `DeviceCertificateGenerator-${id}`, {
      entry: `${__dirname}/../../lambda-assets/device-certificate-generator/app.ts`,
    });
  }
}