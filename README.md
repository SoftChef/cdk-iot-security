# CDK Construct - IoT Security

`cdk-iot-security` is a project surrounding the topic of the AWS IoT Device registration. In order to utilize the AWS IoT services securely, we might need to maintain our own certificate authorities, as known as CAs, and manage the CA-signed device certificates. AWS IoT holds an organized architecture for works mentioned previously, allows us to register multiple CA and certificates to it, and provides APIs for fetching information supporting our management. This project focuses on the autherization work flows of AWS IoT, plans to provide CDK constructs which satisfy the requirements of [Just-in-time registration](https://aws.amazon.com/tw/blogs/iot/just-in-time-registration-of-device-certificates-on-aws-iot/), and also the Construct for [Just-in-time provisioning](https://aws.amazon.com/tw/blogs/iot/setting-up-just-in-time-provisioning-with-aws-iot-core/).

## Installation

### NPM

    npm install @softchef/cdk-iot-security

### Yarn

    yarn add @softchef/cdk-iot-security
    

## Just-in-Time Registration

![](./doc/JITR-AWS.png)

![](./doc/JITR.png)

### Basic Usage

    import { JustInTimeRegistration } from '@softchef/cdk-iot-security';
    import * as cdk from '@aws-cdk/core';
    import * as s3 from '@aws-cdk/aws-s3';
    import * as lambda from '@aws-cdk/aws-lambda';

    const app = new cdk.App();
    const id = 'JitrDemo';
    const stack = new cdk.Stack(app, id);
    const anotherStack = new cdk.Stack(app, 'anotherStack');
    new JustInTimeRegistration(stack, id, {
        vault: {
            bucket: new s3.Bucket(anotherStack, 'myVault2'),
            prefix: 'my/ca/path',
        },
        verifiers: [
            new lambda.Function(anotherStack, 'verifier1', {
                code: lambda.Code.fromInline('exports.handler = async (_event) => { return JSON.stringify({ verified: true }); }'),
                handler: 'handler',
                runtime: lambda.Runtime.NODEJS_12_X,
            }),
            new lambda.Function(anotherStack, 'verifier2', {
                code: lambda.Code.fromInline('exports.handler = async (event) => { return JSON.stringify({ verified: event? true : false }); }'),
                handler: 'handler',
                runtime: lambda.Runtime.NODEJS_12_X,
            })
        ]
    });

## Roadmap

## Just-in-Time Provision

### Demonstration

#### Construct Deployment

    git clone https://github.com/SoftChef/cdk-iot-security.git
    cd cdk-iot-security
    npx projen build
    cdk deploy --app 'node lib/demo/jitp/demo'

After deploying the construct, an URL returned from the console as the following format:

    https://<prefix>.execute-api.<region>.amazonaws.com/prod/

#### Create CA Certificate

Call API with this command.

    curl -X POST https://<prefix>.execute-api.<region>.amazonaws.com/prod/caRegister

The registered CA certificate ID will be returned in the following format.

    {
        "ca":{
            "publicKey":"...",
            "privateKey":"...",
            "certificate":"..."
        },
        "verification":{
            "publicKey":"...",
            "privateKey":"...",
            "certificate":"..."
        },"certificateId":"365322f54ee983a8d36e5ee24b7d5ce684836e859e873c51ac8cac3269472769","certificateArn":"arn:aws:iot:us-east-1:079794712254:cacert/365322f54ee983a8d36e5ee24b7d5ce684836e859e873c51ac8cac3269472769"
    }

Please save the file and replace the sample file ```ca-certificate.json```.

### JITP

* Directly return the generated device certificate and keys in a secure way.
