import {
  Role,
  PolicyDocument,
  PolicyStatement,
  ServicePrincipal,
} from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export class GreenGrassV2TokenExchangeRole extends Role {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, `GreenGrassTokenExchangeRole-${id}`, {
      roleName: `GreenGrassTokenExchangeRoleName-${id}`,
      assumedBy: new ServicePrincipal('credentials.iot.amazonaws.com'),
      inlinePolicies: {
        tokenExchangePolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'iot:DescribeCertificate',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
                'iot:Connect',
                'iot:Publish',
                'iot:Subscribe',
                'iot:Receive',
                's3:GetBucketLocation',
              ],
              resources: [
                '*',
              ],
            }),
          ],
        }),
      },
    });
  }
}