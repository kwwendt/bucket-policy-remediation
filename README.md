## Bucket policy remediation

**Note**: This is an example and should not be used within production environments. This will also 

Uses AWS Config with a custom rule to evaluate if S3 buckets have any bucket policy attached and if there is no bucket policy, it will auto-remediate with a default bucket policy (currently set to TLS enforcement).

There is a remediation action set up but it is set to Manual remediation right now so S3 buckets aren't updated with the default bucket policy unless a user explicitly chooses to.

With some minor adjustments, you can use Config input parameters to control which S3 buckets fall under this compliance check - e.g., bucket tags.