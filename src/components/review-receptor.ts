import {
  Role,
  PolicyStatement,
  ServicePrincipal,
  PolicyDocument,
} from '@aws-cdk/aws-iam';
import {
  CfnTopicRule,
} from '@aws-cdk/aws-iot';
import * as sqs from '@aws-cdk/aws-sqs';
import { Construct } from '@aws-cdk/core';

export class ReviewReceptor extends sqs.Queue {
  /**
   * The Role allowed to push messages into this Receptor.
   */
  public readonly acceptionRole: ReviewAcceptionRole;
  public readonly jitrTopicRule: JitrTopicRule;
  /**
     * Initialize the SQS Queue receiving message from the CA-associated Iot Rules.
     * @param scope
     * @param id
     */
  constructor(scope: Construct, id: string) {
    super(scope, `ReviewReceptor-${id}`, {});
    this.acceptionRole = new ReviewAcceptionRole(this, id, 'iot.amazonaws.com');
    this.jitrTopicRule = new JitrTopicRule(this, id);
  }
}

export class ReviewAcceptionRole extends Role {
  /**
   * Initialize the Role allowed to push messages into the receptor specified in the argument.
   * @param scope
   * @param id
   * @param reviewReceptor The AWS SQS Queue recepting the messages from the IoT Topic Rule.
   * @param principalName The Principal name of the Resource which is arranged to send in the messages.
   */
  constructor(reviewReceptor: ReviewReceptor, id: string, principalName: string) {
    super(reviewReceptor, `ReviewAcceptionRole-${id}`, {
      roleName: `ReviewAcceptionRoleName-${id}`,
      assumedBy: new ServicePrincipal(principalName),
      inlinePolicies: {
        SqsPushPolicy: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: [
                'sqs:SendMessageBatch',
                'sqs:SendMessage',
              ],
              resources: [
                reviewReceptor.queueArn,
              ],
            }),
          ],
        }),
      },
    });
  }
}

export class JitrTopicRule extends CfnTopicRule {
  constructor(queue: ReviewReceptor, id: string) {
    super(queue, `TopicRule-${id}`, {
      topicRulePayload: {
        actions: [
          {
            sqs: {
              queueUrl: queue.queueUrl,
              roleArn: queue.acceptionRole.roleArn,
            },
          },
        ],
        sql: "SELECT * FROM '$aws/events/certificates/registered/#'",
      },
    });
  }
}