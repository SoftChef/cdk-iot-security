# Fleet-Provision Construct Demonstration: Greengrass V2 Mode

The Fleet-Provision flow in Greengrass V2 mode mainly consist of two parts, one is about the service provider, the other is about the client. The service provider deploy the Fleet-Provision construct providing funcionalities of creating Fleet-Provisioning template and provision claim certificate. Then, the service provider create Fleet-Provisioning template and provision claim certificate, and place the provision claim certificate in the device. The client get the device and connect the device to the AWS IoT with the provision claim certificate. The device requests to generate and registers the device certificate, eventually receives the formal device certificate which allows the device to access the provisioned resources. Finally, the device deployes a Greengrass V2 Core with the device certificate. In the following sections, we lead you through the Greengrass V2 mode example step-by-step, and leave some design advices.


## Service Provider Side

### Deploy the Construct

First of all, the service provide should deploy the construct to setup the Fleet-Provision functionalities. Clone the project and build the codes.

    git clone https://github.com/SoftChef/cdk-iot-security.git
    cd cdk-iot-security
    yarn add projen
    npx projen build

Deploy the Fleet-Provision construct with demo file. One AWS lambda functions, Fleet Generator, will be deployed for further use.
    
    cdk deploy --app 'node lib/demo/fleet-provision/greengrass-v2-mode/deploy'

After deploying the construct, an URL returned from the console as this format: ```https://<prefix>.execute-api.<region>.amazonaws.com/prod/```. In the following steps, we will use this URL to access the API.

### Create the Fleet-Provisioning Template and the Provisioning Claim Certificate

Call the API with the following command. 

    curl -X POST -d '{"templateName":"<templateName>"}' https://<prefix>.execute-api.<region>.amazonaws.com/prod/fleetGenerator > fleet.json

The API will invoke the Fleet Generator and return the information, including ID, ARN, keys, and certificate, of the provisioning claim certificate registered on AWS IoT. In the file ```fleet.json```, there is a template ARN. Remember the ARN for late use.

Go to the AWS Cloud Formation Console. Select the stack **FleetProvisionDemo** and find the S3 Bucket under the Resources section. Go to that S3 bucket and find the folder with the name same as the template ARN. Download files ```provision_claim.cert.pem```, ```provision_claim.private_key.pem```, and ```provision-claim-certificate.json``` from that folder. Place these downloaded files under path ```src/demo/fleet-provision/greengrass-v2-mode/certs```.

## Client Side

### Connect the Device with AWS IoT

The AWS IoT Root Certificate is neccessary for the connection. Run this command to download it.

    curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > src/demo/fleet-provision/greengrass-v2-mode/certs/root_ca.cert.pem

Finally, the script ```connect.js``` use the certificate to connect to the AWS IoT through.

    node src/demo/fleet-provision/greengrass-v2-mode/connect.js

A Certificate, a Thing, and an IoT Policy are set on the AWS IoT. Moreover, the device certificate and private key are returned from the AWS IoT and write in the files under path ```./certs```. They can be used by a device for further interaction with AWS IoT.

## Greengrass V2 Installation

Since we deploy the Fleet-Provision Construct in Greengrass V2 mode, the device certificates are able to activate a Greengrass v2 Device Core. In the following section, we assume your are going to deploy a Greengrass V2 Device Core to the Ubuntu 20.04 environment.

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