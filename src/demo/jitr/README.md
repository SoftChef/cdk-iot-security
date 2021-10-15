# JITR Construct Demonstration

The JITR flow mainly consist of two parts, one is about the service provider, the other is about the client. The service provider deploy the JITR construct providing funcionalities to create CA, and create CAs for generating the device certificates. Then, the service provider retrieves the CA certificates from the S3 bucket and transfer the CA certificates to the device. The client gets the device and create device certificates with the CA certificates in the device. Finally, the client uses the device certificate in that device to trigger JITR through the MQTT connection to AWS IoT. In the following sections, we lead you through the basic example step-by-step, and leave some design advices.

## Service Provider Side

### Deploy the Construct

First of all, the service provide should deploy the construct to setup the JITR functionalities. Clone the project and build the codes.

    git clone https://github.com/SoftChef/cdk-iot-security.git
    cd cdk-iot-security
    yarn add projen
    npx projen build

Deploy the JITR construct with demo file. Two AWS lambda functions, CA Registrator and Device Activator, will be deployed for further use.

    cdk deploy --app 'node lib/demo/jitr/deploy'

After deploying the construct, an URL returned from the console as this format: ```https://<prefix>.execute-api.<region>.amazonaws.com/prod/```. In the following steps, we will use this URL to access the API.

### Create CA on AWS IoT

After the construct deployment, the service provider creates CA on AWS IoT for authentication of device certificates later. Call the API with the following command.

    curl -X POST https://<prefix>.execute-api.<region>.amazonaws.com/prod/caRegister

The API will invoke the CA Registrator and return an ID belongs to a CA certificate registered on AWS IoT. Save the CA ID for later use.

In the body of the POST request calling the CA Registrator, you can also send your own certificate subjects. The CA Registrator will set the provided CSR subjects as the subjects of the registered CA.

    {
        "csrSubjects": {
            "countryName": "TW",
            "stateName": "TP",
            "localityName": "TW",
            "organizationName": "Soft Chef",
            "organizationUnitName": "web"
        }
    }

After creating the CA, the service provider make a copy of the CA certificates in the device. Go to the AWS Cloud Formation Console. Select the stack **JitrDemo** and find the S3 Bucket under the Resources section. Go to that S3 bucket and find the folder with the name same as the CA ID. Download files ```ca.cert.pem```, ```ca.private_key.pem```, and ```ca.pubic_key.pem``` from that folder. Place these files under path ```src/demo/jitr/certs```.

## Client Side

When the service provider have done the necessary preparation, the client is able to setup the AWS IoT resources with convenience.

The AWS IoT Root Certificate is neccessary for the connection. Run this command to download it.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > src/demo/jitp/certs/root_ca.cert.pem

Remember to fill up the thing name and the AWS IoT Endpoint in the file ```src/demo/jitr/settings.json```. You can retrieve the endpoint URL with the following command.

    aws iot describe-endpoint --endpoint-type iot:Data-ATS

The AWS IoT Root Certificate and the endpoint are constants for the same service. You can provide those data in the device instead of collect them in the runtime.

Finally, the device creates the certificates and use its certificates to connect to the AWS IoT through MQTT connection.

    node src/demo/jitr/device.js

Alternatively, instead of the ```aws-iot-device-sdk``` library, you can trigger JITR with pure MQTT connection. We simulate this process with another demostration file. Remeber to fill up the AWS IoT endpoint in the same way mentioned previously.

    node src/demo/jitr/mqtt-connect.js

A Certificate, a Thing, and an IoT Policy are set on the AWS IoT for the device.

Instead of placing the CA certificates in the device, the service provider can create the legal deivce certificates in the manufacture and place almost only the device certificates in the device. Mention that the CA certificate is necessary to trigger JITR, it still needs to be place in the device. Please read the code in ```mqtt-connect.js``` for more information.