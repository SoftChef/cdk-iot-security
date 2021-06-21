# cdk-iot-security

## Usage

### Just-in-time Registration

    import { JustInTimeRegistration } from '@softchef/cdk-iot-security';

    // basic usage
    new JustInTimeRegistration(this, "test", {
      vault: {
        prefix: '',
        bucket: AWS_S3_BUCKET
      }
    });

    // providing verifiers
    new JustInTimeRegistration(this, "test", {
      verifiers: [
        {
          name: 'verifier_name_1',
          lambdaFunction: AWS_LAMBDA_FUNCTION_1
        },
        {
          name: 'verifier_name_2',
          lambdaFunction: AWS_LAMBDA_FUNCTION_2
        },
        ...
      ],
      vault: {
        prefix: '',
        bucket: AWS_S3_BUCKET
      }
    });

### Just-in-time Provision

    import { JustInTimeProvision } from '@softchef/cdk-iot-security';

    new JustInTimeProvision(this, "test", {
      vault: {
        prefix: '',
        bucket: AWS_S3_BUCKET
      }
    });