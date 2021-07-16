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

## Just-in-Time Provision

![](./doc/jitp/JITP-AWS.png)

![](./doc/jitp/JITP.png)

### Example

JITP work flow is usually applied in a situation that the device is not able to generate their own certificate. This example simulate the situation with the following steps: the service provider deploy the JITP construct and provide the API; an user client get the generated device certificate through the API; the user client pass the device certificate to the device; the device connet to the AWS IoT through MQTT connection. Finally, the AWS IoT JITP service will be triggered and provision the expected resources.

First, deploy the JITP construct with demo file. Two AWS lambda functions, CA Registrator and Device Certificate Generator, will be deployed for further use.

    git clone https://github.com/SoftChef/cdk-iot-security.git
    cd cdk-iot-security
    npx projen build
    cdk deploy --app 'node lib/demo/jitp/deploy'

After deploying the construct, an URL returned from the console as the following format. In the following steps, we will use this URL to access the API.

    https://<prefix>.execute-api.<region>.amazonaws.com/prod/

Call the API with the following command. The API will invoke the CA Registrator and return an ID belongs to a CA certificate registered on AWS IoT. Save the CA ID for later use. In this POST request, you can also send your own provision template. You can design your own way to use the CA Registrator.

    curl -X POST https://<prefix>.execute-api.<region>.amazonaws.com/prod/caRegister

Call the API with the following command. The API will invoke the Device Certificate Registrator and return the keys and certificate signed by a specified CA. Notice that the device certificate is not registered on AWS IoT yet.

    curl -X POST -d '{"caCertificateId":"<caCertificateId>"}' https://<prefix>.execute-api.<region>.amazonaws.com/prod/deviceCertificateGenerate > device-certificate.json

You can design your work flow that the user call this API to get a device certificate through a mobile App. Then, transfer the device certificate to the device for connecting to the AWS IoT.

The AWS IoT Root Certificate is neccessary for the connection. Run this command to download it.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > src/demo/jitp/root_ca.cert.pem

Finally, the device use the certificate to connect to the AWS IoT through MQTT connection. We simulate this process with the demostration file.

    node src/demo/jitp/device.js

A Certificate, Thing, and IoT Policy is set on the AWS IoT for the device.

## Fleet Provision

### Example

First, deploy the Fleet Provision Construct with demo file.

    git clone https://github.com/SoftChef/cdk-iot-security.git
    cd cdk-iot-security
    npx projen build
    cdk deploy --app 'node lib/demo/fleet-provision/deploy'

After deploying the construct, an URL returned from the console as the following format. In the following steps, we will use this URL to access the API.

    https://<prefix>.execute-api.<region>.amazonaws.com/prod/


Call the API with the following command. The API will invoke the Fleet Generator and return the information, including ID, ARN, keys, and certificate, of the provisioning claim certificate registered on AWS IoT. Save the information for later use. Note that in this POST request, you can also send your own provision template. You can design your own way to use the Fleet Generator.

    curl -X POST -d '{"templateName":"<templateName>"}' https://<prefix>.execute-api.<region>.amazonaws.com/prod/fleetGenerator > fleet.json

In the file ```fleet.json```, there is a template ARN. Remember the ARN for late use.

Go to the AWS Cloud Formation Console. Select the stack **FleetProvisionDemo** and find the S3 Bucket under the Resources section. Go to that S3 bucket and find the folder with the name same as the template ARN. Download files ```provision_claim.cert.pem```, ```provision_claim.private_key.pem```, and ```provision-claim-certificate.json``` from that folder. Place these downloaded files under path ```src/demo/fleet-provision/certs```.

The AWS IoT Root Certificate is neccessary for the connection. Run this command to download it.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > src/demo/fleet-provision/certs/root_ca.cert.pem

Finally, the script ```connect.js``` use the certificate to connect to the AWS IoT through.

    node src/demo/fleet-provision/connect.js

A Certificate, a Thing, and an IoT Policy are set on the AWS IoT. Moreover, the device certificate and private key are returned from the AWS IoT and write in the files under path ```./certs```. They can be used by a device for further interaction with AWS IoT.

### Greengrass V2 Mode

If you have modify the file ```deploy.ts``` and deploy the Fleet Provision Construct in the Greengrass V2 mode, the returned device certificate and private key, which have the file name ```device.cert.pem``` and ```device.private_key.pem```, are able to activate a Greengrass v2 Device Core.

In the following section, we assume your are deploy a Greengrass V2 Device Core to the Ubuntu 20.04 environment.

Create the directory and set the permission.

    sudo mkdir -p /greengrass/v2
    sudo chmod 755 /greengrass

Transfer the device certificate and private key to your device for Greengrass V2 Device Core installation, and place at path ```/greengrass/v2```.

Run the following command to download the Greengrass Core.

    curl -s https://d2s8p88vqu9w66.cloudfront.net/releases/greengrass-nucleus-latest.zip > greengrass-nucleus-latest.zip
    unzip greengrass-nucleus-latest.zip -d GreengrassCore && rm greengrass-nucleus-latest.zip

Run the following command to download the AWS Root CA.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > /greengrass/v2/root_ca.cert.pem

Check the endpoints for later use.

    aws iot describe-endpoint --endpoint-type iot:Data-ATS
    aws iot describe-endpoint --endpoint-type iot:CredentialProvider

Create and modify the file ```GreengrassCore/config.yaml``` as the following contents.
		
    ---
    system:
    certificateFilePath: "/greengrass/v2/device.cert.pem"
    privateKeyPath: "/greengrass/v2/device.private_key.pem"
    rootCaPath: "/greengrass/v2/root_ca.cert.pem"
    rootpath: "/greengrass/v2"
    thingName: "<the thing name previously set in connect.js script>"
    services:
    aws.greengrass.Nucleus:
        componentType: "NUCLEUS"
        version: "2.3.0"
        configuration:
        awsRegion: "<your desirable region>"
        iotCredEndpoint: "<your aws iot credential endpoint>"
        iotDataEndpoint: "<your aws iot data endpoint>"

Run the following command to setup the Greengrass V2 Deivce core.

    sudo -E java -Droot="/greengrass/v2" -Dlog.store=FILE \
        -jar ./GreengrassCore/lib/Greengrass.jar \
        --init-config ./GreengrassCore/config.yaml \
        --component-default-user ggc_user:ggc_group \
        --setup-system-service true \
        --deploy-dev-tools true

A Greengrass V2 Device Core is created on AWS IoT.

## Roadmap

### JITP

* Directly return the generated device certificate and keys in a secure way.
