import {
  Role,
  PolicyStatement,
  ServicePrincipal,
  PolicyDocument,
} from '@aws-cdk/aws-iam';
import * as sqs from '@aws-cdk/aws-sqs';
import { Construct } from '@aws-cdk/core';

export class ReviewReceptor extends sqs.Queue {
  /**
   * The Role allowed to push messages into this Receptor.
   */
  public readonly acceptionRole: ReviewAcceptionRole;
  /**
     * Initialize the SQS Queue receiving message from the CA-associated Iot Rules.
     * @param scope
     * @param id
     */
  constructor(scope: Construct, id: string) {
    super(scope, `ReviewReceptor-${id}`, {});
    this.acceptionRole = new ReviewAcceptionRole(this, 'iot.amazonaws.com');
  }
}


export class ReviewAcceptionRole extends Role {
  /**
   * Initialize the Role allowed to push messages into the receptor specified in the argument.
   * @param reviewReceptor The AWS SQS Queue recepting the messages from the IoT Topic Rule.
   * @param principalName The Principal name of the Resource which is arranged to send in the messages.
   */
  constructor(reviewReceptor: ReviewReceptor, principalName: string) {
    let id = reviewReceptor.node.id.replace('ReviewReceptor', 'ReviewAcceptionRole');
    let roleName = reviewReceptor.node.id.replace('ReviewReceptor', 'ReviewAcceptionRoleName');
    super(reviewReceptor, id, {
      roleName: roleName,
      assumedBy: new ServicePrincipal(principalName),
      inlinePolicies: {
        SqsPushPolicy: new PolicyDocument({
          statements: [new PolicyStatement({
            actions: [
              'sqs:SendMessageBatch',
              'sqs:SendMessage',
            ],
            resources: [
              reviewReceptor.queueArn,
            ],
          })],
        }),
      },
    });
  }
}
