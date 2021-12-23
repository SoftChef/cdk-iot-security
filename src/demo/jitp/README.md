# JITP Construct Demonstration

The JITP flow mainly consist of two parts, one is about the service provider, the other is about the client. The service provider deploy the JITP construct providing funcionalities to create CA and device certificate, and create CAs for generating the device certificates. The client specify a CA to retrieve the device certificate from the API, and use the device certificate to trigger JITP through the MQTT connection to AWS IoT. In the following sections, we lead you through the basic example step-by-step, and leave some design advices.

## Service Provider Side

### Deploy the Construct

First of all, the service provide should deploy the construct to setup the JITP functionalities. Clone the project and build the codes.

    git clone https://github.com/SoftChef/cdk-iot-security.git
    cd cdk-iot-security
    yarn add projen
    npx projen build

Deploy the JITP construct with demo file. Two AWS lambda functions, CA Registrator and Device Certificate Generator, will be deployed for further use.

    cdk deploy --app 'node lib/demo/jitp/deploy'

After deploying the construct, an URL returned from the console as this format: `https://<prefix>.execute-api.<region>.amazonaws.com/prod/`. In the following steps, we will use this URL to access the API.

### Create CA on AWS IoT

After the construct deployment, the service provider creates CA on AWS IoT for authentication of device certificates later. Call the API with the following command.

    curl -X POST https://<prefix>.execute-api.<region>.amazonaws.com/prod/caRegister

The API will invoke the CA Registrator and return an ID belongs to a CA certificate registered on AWS IoT. Save the CA ID for later use.

In the body of the POST request calling the CA Registrator, you can also send your own certificate subjects and provision template. The CA Registrator will set the provided CSR subjects as the subjects of the registered CA, and set the template body as the [provisioning template](https://docs.aws.amazon.com/iot/latest/developerguide/provision-template.html) determining what resources are provisioned for the new device.

    {
        "csrSubjects": {
            "countryName": "TW",
            "stateName": "TP",
            "localityName": "TW",
            "organizationName": "Soft Chef",
            "organizationUnitName": "web"
        },
        "templateBody": "templateBody": "{ \"Parameters\" : { \"AWS::IoT::Certificate::Country\" : { \"Type\" : \"String\" }, \"AWS::IoT::Certificate::Id\" : { \"Type\" : \"String\" } }, \"Resources\" : { \"thing\" : { \"Type\" : \"AWS::IoT::Thing\", \"Properties\" : { \"ThingName\" : {\"Ref\" : \"AWS::IoT::Certificate::Id\"}, \"AttributePayload\" : { \"version\" : \"v1\", \"country\" : {\"Ref\" : \"AWS::IoT::Certificate::Country\"}} } }, \"certificate\" : { \"Type\" : \"AWS::IoT::Certificate\", \"Properties\" : { \"CertificateId\": {\"Ref\" : \"AWS::IoT::Certificate::Id\"}, \"Status\" : \"ACTIVE\" } }, \"policy\" : {\"Type\" : \"AWS::IoT::Policy\", \"Properties\" : { \"PolicyDocument\" : \"{\\\"Version\\\": \\\"2012-10-17\\\",\\\"Statement\\\": [{\\\"Effect\\\":\\\"Allow\\\",\\\"Action\\\": [\\\"iot:Connect\\\",\\\"iot:Publish\\\"],\\\"Resource\\\" : [\\\"*\\\"]}]}\" } } } }"
    }

## Client Side

### Create Device Certificate

When the service provider have done the necessary preparation, the client is able to setup the AWS IoT resources with convenience. Call the API with the following command.

    curl -X POST -d '{caCertificateId:"<caCertificateId>"}' https://<prefix>.execute-api.<region>.amazonaws.com/prod/deviceCertificateGenerate > device-certificate.json

You can assign your custom thing name in the POST request.

    curl -X POST -d '{caCertificateId:"<caCertificateId>", "csrSubjects":{"commonName":"<thingName>"}}' https://<prefix>.execute-api.<region>.amazonaws.com/prod/deviceCertificateGenerate > device-certificate.json

The API will invoke the Device Certificate Registrator and return the keys and certificate signed by a specified CA. Note that the device certificate is not registered on AWS IoT yet.

You can design your work flow that the user call this API to get a device certificate through a mobile App. Then, transfer the device certificate to the device for connecting to the AWS IoT.

### Connect the Device with AWS IoT

When the device certificates returned from the API, things are almost done. The client extract the device certificates from the returned payload and set them into the device.

Create a folder `scr/demo/jitp/certs`. **Manually** copy and paste the public key, private key, and certificate from the file `device-certificate.json` to files `device.public_key.pem`, `device.private_key.pem`, and `device.cert.pem`, respectively, and place under the folder `scr/demo/jitp/certs`. Remember to remove the format characters such as `\r\n` and make those files be a legal PEM format.

The AWS IoT Root Certificate is neccessary for the connection. Run this command to download it.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > src/demo/jitp/certs/root_ca.cert.pem

Remember to fill up the thing name and the AWS IoT Endpoint in the file `src/demo/jitp/settings.json`. You can retrieve the endpoint URL with the following command.

    aws iot describe-endpoint --endpoint-type iot:Data-ATS

The AWS IoT Root Certificate and the endpoint are constants for the same service. You can provide those data in the device instead of collect them in the runtime.

Finally, the device use the certificate to connect to the AWS IoT through MQTT connection. We simulate this process with the demostration file.

    node src/demo/jitp/device.js

Alternatively, instead of the `aws-iot-device-sdk` library, you can trigger JITP with pure MQTT connection. We simulate this process with another demostration file. Remeber to fill up the AWS IoT endpoint in the same way mentioned previously.

    node src/demo/jitp/mqtt-connect.js

A Certificate, Thing, and IoT Policy are set on the AWS IoT for the device.
