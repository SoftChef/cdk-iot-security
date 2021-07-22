# CDK Construct - IoT Security

`cdk-iot-security` is a project surrounding the topic of the AWS IoT Device registration. In order to utilize the AWS IoT services securely, we might need to maintain our own certificate authorities, as known as CAs, and manage the CA-signed device certificates. AWS IoT holds an organized architecture for works mentioned previously, allows us to register multiple CA and certificates to it, and provides APIs for fetching information supporting our management. This project focuses on the autherization work flows of AWS IoT, plans to provide CDK constructs which satisfy the requirements of [Just-in-time registration](https://aws.amazon.com/tw/blogs/iot/just-in-time-registration-of-device-certificates-on-aws-iot/), and also the Construct for [Just-in-time provisioning](https://aws.amazon.com/tw/blogs/iot/setting-up-just-in-time-provisioning-with-aws-iot-core/).

## Installation

### NPM

    npm install @softchef/cdk-iot-security

### Yarn

    yarn add @softchef/cdk-iot-security
    

## Just-in-Time Registration

JITR work flow is usually applied in a situation that the devices are able to generate their own certificates. The scenario would probably like the following: the service provider deploy the JITR construct; the service provider create registered CA; the service provider make a copy of the CA certificate on a device and provide the device for the user client; an user client turn on the device and the device generate its certificate; the device connect to the AWS IoT through MQTT connection. The AWS IoT JITR service will be triggered and the JITR MQTT message will be passed through the topic rule, the SQS queue, eventually reach the Device Activator. Finally, the Device Activator verifies and activates the device certificate, and provision the AWS IoT resources for the device certificate.

### Structure

![](./doc/JITR-AWS.png)

#### Endogenous Components

##### Device Activator

The NodeJS Lambda Function with the functionality of activating a device certificate requesting for JITR.

##### CA Registrator

The NodeJS Lambda Function with the functionality of registering a CA certificate on AWS IoT.

##### Verifiers Fetcher

The NodeJS Lambda Function with the functionality of returning the names of the verfifiers.

##### JITR Topic Rule

The AWS IoT Topic Rule with the functionality of collecting the MQTT message originating from the JITR request.

##### Review Receptor

The SQS queue with the functionality of recepting the MQTT message collected by the JITP Topic Rule and pass to the Device Activation for further review.

#### Exogenous Components

##### Vault

The S3 Bucket provided by the user for storing the created CA certificate secerts, including certificate, private key, and public key, also the CA certificate ID and ARN.

##### Verifiers

The Lambda Function provided by the user for device verification. If must return a payload with the following format:

    {
        ...
        "verified": "true", // or false
    }

If it returns ```{"verified": "true"}```, the Device Activator would complete the provision. Otherwise, the process is interrupted.

##### API

You can integrate your own API to the CA registrator and Verifiers Fetcher for utilization.

### Flow

![](./doc/JITR.png)

### Usage

#### Overview

The process of applying JITR is mainly consist of the following steps:

1. Initialize the JITR construct.

2. Create CA through calling the CA Registrator.

3. Create the device certificate with the device.

4. Connect the device to the AWS IoT.

Some details informations of those three steps are discussed in the following sections. For step-by-step guide, please read the [JITR demonstration files](./src/demo/jitr/README.md).

#### Initialize the JITR Construct

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

#### Calling the CA Registrator

You call the CA Registrator to registrate a new CA on the AWS IoT before generating a device certificate.

CA Registrator assumes receiving an event object with the following format:

    event = {
        ...
        "body": {
            "csrSubjects": {
                "commonName": "myName",
                "countryName": "TW",
                "stateName": "TP",
                "localityName": "TW",
                "organizationName": "Soft Chef",
                "organizationUnitName": "web"
            },
            "verifierName": "verifier_name",
        }
    }

Since the event is mainly a HTTP POST request, it has a body section containing attached information. The body consist of three parts, CSR subjects, verifier name, and template body.

* CSR subjects define the information to fill up the subject fields of the CA certificate. CSR subjects are optional. If some of the fields are leaved blank, those fields will be fill up with empty string. Mandated by the AWS, the common name field would be replaced by the registration code, thus is unnecessary.

* Verifier name specifies the verifier applied in the device verification. Verifier name is Optional.

#### Calling the Verifiers Fetcher

You can checkout the names of the verifiers through the Verifiers Fetcher when you forget the names.

Verifiers Fetcher assumes receiving an event object with the following format:

    event = {
        ...
        body: {}
    }

Since the event is mainly a HTTP GET request, no body content is expected. However, no matter what the request content is, the Verifiers Fetcher always return all the verifiers' name.

#### Connect the Device to the AWS IoT

To trigger the JITR and the provisioning of resources, the deivce has to send a MQTT message to the AWS IoT. You need to have the basic knowledge about the MQTT. You can complete this step with either a pure MQTT connection, or ```aws-iot-deivce-sdk```. For the former, please read [mqtt-connect.js](./src/demo/jitr/mqtt-connect.js), for the later, please read [device.js](./src/demo/jitr/device.js)

## Roadmap

### JITP

* Directly return the generated device certificate and keys in a secure way.
