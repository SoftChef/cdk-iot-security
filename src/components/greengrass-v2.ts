import {
  Role,
  PolicyDocument,
  PolicyStatement,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import {
  Construct,
} from 'constructs';

/**
 * The IAM Role defining the permissions for Greengrass V2 Core Device to access the sevices other than the AWS IoT through token exchanging machanism.
 */
export class GreenGrassV2TokenExchangeRole extends Role {
  /**
   * Initialize the Greengrass V2 Token Exchange Role.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id: string) {
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
                's3:GetObject',
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