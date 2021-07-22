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

JITP work flow is usually applied in a situation that the devices are not able to generate their own certificates. The scenario would probably like the following: the service provider deploies the JITP construct and provides the API for the user client; the service provider creates registered CA; an user client get the generated device certificate through the API; the user client pass the device certificate to the device; the device connect to the AWS IoT through MQTT connection. Finally, the AWS IoT JITP service will be triggered and provision the expected resources.

### Structure

![](./doc/jitp/JITP-AWS.png)

#### Endogenous Components

##### CA Registrator

The NodeJS Lambda Function with the functionality of registering a CA certificate on AWS IoT.

##### Verifiers Fetcher

The NodeJS Lambda Function with the functionality of returning the names of the verfifiers.

##### Device Certificate Generator

The NodeJS Lambda Function with the functionality of generating the device certificate.

#### Exogenous Components

##### Vault

The S3 Bucket provided by the user for storing the created CA certificate secerts, including certificate, private key, and public key, also the CA certificate ID and ARN.

##### Verifiers

The Lambda Function provided by the user for device verification. If must return a payload with the following format:

    {
        ...
        "verified": "true", // or false
    }

If it returns ```{"verified": "true"}```, the Device Certificate Generator would complete the device certificate generation. Otherwise, the process is interrupted.

##### API

You can integrate your own API to the CA registrator, Device Certificate Generator, and Verifiers Fetcher for further utilization.

### Flow

![](./doc/jitp/JITP.png)

### Usage

#### Overview

The process of applying JITP is mainly consist of the following steps:

1. Initialize the JITP construct.

2. Create CA through calling the CA Registrator.

3. Create Device Certificate through calling the Device Certificate Generator.

4. Connect the device to the AWS IoT.

Some details informations of those three steps are discussed in the following sections. For step-by-step guide, please read the [JITP demonstration files](./src/demo/jitp/README.md).

#### Initialize the JITP Construct

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
        ],
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
            "templateBody": "{ \"Parameters\" : { \"AWS::IoT::Certificate::Country\" : { \"Type\" : \"String\" }, \"AWS::IoT::Certificate::Id\" : { \"Type\" : \"String\" } }, \"Resources\" : { \"thing\" : { \"Type\" : \"AWS::IoT::Thing\", \"Properties\" : { \"ThingName\" : {\"Ref\" : \"AWS::IoT::Certificate::Id\"}, \"AttributePayload\" : { \"version\" : \"v1\", \"country\" : {\"Ref\" : \"AWS::IoT::Certificate::Country\"}} } }, \"certificate\" : { \"Type\" : \"AWS::IoT::Certificate\", \"Properties\" : { \"CertificateId\": {\"Ref\" : \"AWS::IoT::Certificate::Id\"}, \"Status\" : \"ACTIVE\" } }, \"policy\" : {\"Type\" : \"AWS::IoT::Policy\", \"Properties\" : { \"PolicyDocument\" : \"{\\\"Version\\\": \\\"2012-10-17\\\",\\\"Statement\\\": [{\\\"Effect\\\":\\\"Allow\\\",\\\"Action\\\": [\\\"iot:Connect\\\",\\\"iot:Publish\\\"],\\\"Resource\\\" : [\\\"*\\\"]}]}\" } } } }"
            }
        }
    }

Since the event is mainly a HTTP POST request, it has a body section containing attached information. The body consist of three parts, CSR subjects, verifier name, and template body.

* CSR subjects define the information to fill up the subject fields of the CA certificate. CSR subjects are optional. If some of the fields are leaved blank, those fields will be fill up with empty string. Mandated by the AWS, the common name field would be replaced by the registration code, thus is unnecessary.

* Verifier name specifies the verifier applied in the device verification. Verifier name is Optional.

* Template body is a string defining the resources provisioned for the device. Template body is Optional. If no template body being specified, a default template body will be applied. See more information about defining a template body from [here](https://docs.aws.amazon.com/iot/latest/developerguide/jit-provisioning.html).

#### Calling the Device Certificate Generator

You call the Device Certificate Generator to generate a device certificate after register a CA on AWS IoT.

Device Certificate Generator assumes receiving an event object with the following format:

    event = {
        ...
        body: {
            "caCertificateId": "myCaCertificateId",
            "csrSubjects": {
                "commonName": "myThingName", // data in this field would be the thing name
                "countryName": "TW",
                "stateName": "TP",
                "localityName": "TW",
                "organizationName": "Soft Chef",
                "organizationUnitName": "web"
            },
            "deviceInfo": {
                ...
            },
        }        
    }

Since the event is mainly a HTTP POST request, it has a body section containing attached information. The body consist of three parts, CA certificate ID, CSR subjects, and device information.

* CA certificate ID is the ID of the CA created by the CA Registrator. CA certificate ID is required by the Device Certificate Generator. The CA will authenticate the device certificate.

* CSR subjects define the information to fill up the subject fields of the device certificate. CSR subjects are optional. If some of the fields are leaved blank, those fields will be fill up with empty string. The string data in the common name field will be set as the name of the AWS IoT Thing. Thing name is the desirable name you give to the AWS IoT thing provisioned for the device certificate. If no thing name is specified, the thing name would be an UUID.

* Device information is the information provided by the device for verification. Whether it is required or not and its form depends on your configuration of the verifiers.

#### Calling the Verifiers Fetcher

You can checkout the names of the verifiers through the Verifiers Fetcher when you forget the names.

Verifiers Fetcher assumes receiving an event object with the following format:

    event = {
        ...
        body: {}
    }

Since the event is mainly a HTTP GET request, no body content is expected. However, no matter what the request content is, the Verifiers Fetcher always return all the verifiers' name.

#### Connect the Device to the AWS IoT

To trigger the JITR and the provisioning of resources, the deivce has to send a MQTT message to the AWS IoT. You need to have the basic knowledge about the MQTT. You can complete this step with either a pure MQTT connection, or ```aws-iot-deivce-sdk```. For the former, please read [this file](./src/demo/jitp/mqtt-connect.js), for the later, please read [this file](./src/demo/jitp/device.js).

## Examples

* JITR

* [JITP](./src/demo/jitp/README.md)

* Fleet-Provisioning

## Roadmap

### JITP

* Verify which user is calling the device certificate generator API.

* Manage the thing name and user relationship.
