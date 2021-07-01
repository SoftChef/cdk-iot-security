# cdk-iot-security

## Usage


    import { JustInTimeRegistration } from '@softchef/cdk-iot-security';

    new JustInTimeRegistration(this, "test", {
      vault: {
        prefix: '',
        bucket: AWS_S3_BUCKET
      }
    });