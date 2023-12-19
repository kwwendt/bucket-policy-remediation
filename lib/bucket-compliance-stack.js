const { Stack, Duration } = require('aws-cdk-lib');
const iam = require('aws-cdk-lib/aws-iam');
const sns = require('aws-cdk-lib/aws-sns');
const lambda = require('aws-cdk-lib/aws-lambda');
const config = require('aws-cdk-lib/aws-config');
const subscriptions = require('aws-cdk-lib/aws-sns-subscriptions');

class BucketComplianceStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    const configRuleFunc = new lambda.Function(this, "ConfigRuleFunction", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda/custom_rule'),
      handler: 'index.lambda_handler',
      timeout: Duration.seconds(60)
    });

    configRuleFunc.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ListBuckets',
          's3:ListAllMyBuckets',
          's3:GetBucketPolicy',
          'config:PutEvaluations'
        ],
        resources: [
          '*'
        ]
      })
    );

    const customRule = new config.CustomRule(this, "CustomBucketRule", {
      configurationChanges: true,
      lambdaFunction: configRuleFunc,
      ruleScope: config.RuleScope.fromResource(config.ResourceType.S3_BUCKET)
    });

    const remediationTopic = new sns.Topic(this, "RemediationTopic");

    const publishRole = new iam.Role(this, "PublishIAMRole", {
      assumedBy: new iam.ServicePrincipal("ssm.amazonaws.com")
    });

    remediationTopic.grantPublish(publishRole);

    const cfnRemediationConfig = new config.CfnRemediationConfiguration(this, "BucketPolicyConfigRemediation", {
      configRuleName: customRule.configRuleName,
      targetId: "AWS-PublishSNSNotification",
      targetType: "SSM_DOCUMENT",
      automatic: false,
      maximumAutomaticAttempts: 3,
      retryAttemptSeconds: 60,
      parameters: {
        TopicArn: { StaticValue: { Values: [ remediationTopic.topicArn ] } },
        Message: { ResourceValue: { Value: 'RESOURCE_ID' } },
        AutomationAssumeRole: { StaticValue: { Values: [ publishRole.roleArn ] } }
      }
    });

    const remediationFunc = new lambda.Function(this, "RemediationFunction", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('lambda/remediation'),
      handler: 'index.lambda_handler',
      timeout: Duration.seconds(60)
    });

    remediationFunc.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:PutBucketPolicy'
        ],
        resources: [
          '*'
        ]
      })
    );

    remediationTopic.addSubscription(new subscriptions.LambdaSubscription(remediationFunc));
  }
}

module.exports = { BucketComplianceStack }
