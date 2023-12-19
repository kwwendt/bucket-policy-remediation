import json
import boto3

s3_client = boto3.client('s3')

def lambda_handler(event, context):
    for record in event['Records']:
        try:
            bucket_name = record['Sns']['Message']
            apply_bucket_policy(bucket_name)
        except Exception as e:
            raise e

def apply_bucket_policy(bucket_name):
    with open('bucketPolicy.json') as policy_template:
        policy = json.dumps(json.load(policy_template))
    
    policy = policy.replace("BUCKET_NAME", bucket_name)

    response = s3_client.put_bucket_policy(
        Bucket=bucket_name,
        ConfirmRemoveSelfBucketAccess=True,
        Policy=policy
    )
