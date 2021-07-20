# CDK Construct - IoT Security

`cdk-iot-security` is a project surrounding the topic of the AWS IoT Device registration. In order to utilize the AWS IoT services securely, we might need to maintain our own certificate authorities, as known as CAs, and manage the CA-signed device certificates. AWS IoT holds an organized architecture for works mentioned previously, allows us to register multiple CA and certificates to it, and provides APIs for fetching information supporting our management. This project focuses on the autherization work flows of AWS IoT, plans to provide CDK constructs which satisfy the requirements of [Just-in-time registration](https://aws.amazon.com/tw/blogs/iot/just-in-time-registration-of-device-certificates-on-aws-iot/), and also the Construct for [Just-in-time provisioning](https://aws.amazon.com/tw/blogs/iot/setting-up-just-in-time-provisioning-with-aws-iot-core/).

## Installation

### NPM

    npm install @softchef/cdk-iot-security

### Yarn

    yarn add @softchef/cdk-iot-security
    

## Just-in-Time Registration

![](./doc/jitr/JITR-AWS.png)

![](./doc/jitr/JITR.png)

### Usage

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

## Just-in-Time Provision

JITP work flow is usually applied in a situation that the device is not able to generate their own certificate. This example simulate the situation with the following steps: the service provider deploy the JITP construct and provide the API; an user client get the generated device certificate through the API; the user client pass the device certificate to the device; the device connet to the AWS IoT through MQTT connection. Finally, the AWS IoT JITP service will be triggered and provision the expected resources.

![](./doc/jitp/JITP-AWS.png)

![](./doc/jitp/JITP.png)

### Usage

    import { JustInTimeProvision } from '@softchef/cdk-iot-security';
    import { Bucket } from '@aws-cdk/aws-s3';
    import * as cdk from '@aws-cdk/core';

    const app = new cdk.App();
    const id = 'JitpDemo';
    const stack = new cdk.Stack(app, id);
    const justInTimeProvision = new JustInTimeProvision(stack, id, {
        vault: {
            bucket: new Bucket(stack, 'myVault'),
        },
    });

### Examples

* JITR

* [JITP](./src/demo/jitp/README.md)

* Fleet-Provisioning

## Roadmap

### JITP

* Verify which user is calling the device certificate generator API.

* Manage the thing name and user relationship.
