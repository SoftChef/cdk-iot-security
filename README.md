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

## Example

First, deploy the JITR construct with demo file. Two AWS lambda functions, CA Registrator and Device Activator, will be deployed for further use.

    git clone https://github.com/SoftChef/cdk-iot-security.git
    cd cdk-iot-security
    npx projen build
    cdk deploy --app 'node lib/demo/jitr/deploy'

After deploying the construct, an URL returned from the console as the following format. In the following steps, we will use this URL to access the API.

    https://<prefix>.execute-api.<region>.amazonaws.com/prod/

Call the API with the following command. The API will invoke the CA Registrator and return an ID belongs to a CA certificate registered on AWS IoT. Save the CA ID for later use. You can design your own way to use the CA Registrator.

    curl -X POST https://<prefix>.execute-api.<region>.amazonaws.com/prod/caRegister

Go to the AWS Cloud Formation Console. Select the stack 'JitrDemo' and find the S3 Bucket under the Resources section. Go to that S3 bucket and find the folder with the name same as the CA ID. Download files ```ca.cert.pem```, ```ca.private_key.pem```, and ```ca.pubic_key.pem``` from that folder. Place these downloaded files under path ```src/demo/jitr/certs```.

The AWS IoT Root Certificate is neccessary for the connection. Run this command to download it.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > src/demo/jitp/certs/root_ca.cert.pem

Finally, the device use the certificate to connect to the AWS IoT through MQTT connection.

    node src/demo/jitr/device.js

A Certificate, Thing, and IoT Policy is set on the AWS IoT for the device.

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

    curl -X POST -d '{caCertificateId:"<caCertificateId>"}' https://<prefix>.execute-api.<region>.amazonaws.com/prod/deviceCertificateGenerate > device-certificate.json

You can design your work flow that the user call this API to get a device certificate through a mobile App. Then, transfer the device certificate to the device for connecting to the AWS IoT.

The AWS IoT Root Certificate is neccessary for the connection. Run this command to download it.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > src/demo/jitp/root_ca.cert.pem

Finally, the device use the certificate to connect to the AWS IoT through MQTT connection. We simulate this process with the demostration file.

    node src/demo/jitp/device.js

A Certificate, Thing, and IoT Policy is set on the AWS IoT for the device.

## Roadmap

### JITP

* Directly return the generated device certificate and keys in a secure way.
