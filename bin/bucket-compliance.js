#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { BucketComplianceStack } = require('../lib/bucket-compliance-stack');

const app = new cdk.App();
new BucketComplianceStack(app, 'BucketComplianceStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
});
