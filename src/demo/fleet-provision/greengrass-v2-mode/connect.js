const { mqtt, io, iot, iotidentity } = require('aws-iot-device-sdk-v2');
const fs = require('fs');

/**
 * Fill in the template name, endpoint, and thing name in settings.json before running this file.
 */
var settings = fs.readFileSync(`${__dirname}/settings.json`);
const {
  thingName,
  iotDataEndpoint,
  templateName
} = JSON.parse(settings);
const clinetId = `client-${thingName}`;

/**
 * Place the AWS Root CA, provision claim certificate, and provision claim private key 
 * at ./certs before running this file.
 * Download AWS IoT Root CA Certificate from https://www.amazontrust.com/repository/AmazonRootCA1.pem
 * and save it as root_ca.cert.pem.
 */
const keysPath = {
  provisionClaim: {
    certificate: `${__dirname}/certs/provision_claim.cert.pem`,
    privateKey: `${__dirname}/certs/provision_claim.private_key.pem`,
  },
  awsRootCa: `${__dirname}/certs/root_ca.cert.pem`,
  device: {
    certificate: `${__dirname}/certs/device.cert.pem`,
    privateKey: `${__dirname}/certs/device.private_key.pem`,
    info: `${__dirname}/certs/device-certificate.json`,
  },
};

function provision() {
  
  return new Promise(async (resolve, reject) => {
    console.log("Set timout after 60 seconds.");
    const timer = setTimeout(() => {}, 60 * 1000);

    console.log("Initialize connection.");
    const clientBootstrap = new io.ClientBootstrap();
    const client = new mqtt.MqttClient(clientBootstrap);
    const config = iot.AwsIotMqttConnectionConfigBuilder
    .new_mtls_builder_from_path(keysPath.provisionClaim.certificate, keysPath.provisionClaim.privateKey)
    .with_certificate_authority_from_path(undefined, keysPath.awsRootCa)
    .with_clean_session(false)
    .with_client_id(clinetId)
    .with_endpoint(iotDataEndpoint)
    .build();
    const connection = client.new_connection(config);  
    const identity = new iotidentity.IotIdentityClient(connection);
    await connection.connect();

    const token = await getOwnershipToken(identity);

    await registerThing(identity, token);
  
    console.log("Disconnected")
    await connection.disconnect();
    clearTimeout(timer);
    resolve();
  });
}

function getOwnershipToken(identity) {
  return new Promise(async (resolve, reject) => {
    let token;
    console.log("Subscribe to CreateKeysAndCertificateAccepted.");
    await identity.subscribeToCreateKeysAndCertificateAccepted(
      {},
      mqtt.QoS.AtLeastOnce,
      (error, response) => {
        if (response) {

          console.log(`Write certificate information to ${keysPath.device.info}.`);
          fs.writeFileSync(keysPath.device.info, JSON.stringify({
              certificateId: response.certificateId,
              certificateOwnershipToken: response.certificateOwnershipToken,
              thingName,
          }));
          
          console.log(`Write device certificate to ${keysPath.device.certificate}.`);
          fs.writeFileSync(keysPath.device.certificate, response.certificatePem);

          console.log(`Write device private key to ${keysPath.device.privateKey}.`);
          fs.writeFileSync(keysPath.device.privateKey, response.privateKey);

          token = response.certificateOwnershipToken;
          console.log("Returned ownership token: ")
          console.log({
            certificateOwnershipToken: token,
          });

          resolve(token);
        }
        if (error) {
          console.log(error);
          reject(error);
        };
      }
    );

    console.log("Subscribe to CreateKeysAndCertificateRejected.");
    await identity.subscribeToCreateKeysAndCertificateRejected(
      {},
      mqtt.QoS.AtLeastOnce,
      (error, response) => {
        console.log({error, response});
        if (error) reject(error);
      }
    );

    console.log("Publish to CreateKeysAndCertificate.");
    await identity.publishCreateKeysAndCertificate({}, mqtt.QoS.AtLeastOnce);
  });
}

function registerThing(identity, token) {
  return new Promise(async (resolve, reject) => {
    console.log("Subscribe to RegisterThingAccepted.");
    await identity.subscribeToRegisterThingAccepted(
      {templateName},
      mqtt.QoS.AtLeastOnce,
      (error, response) => {
        console.log(response)
        if (response) {
          console.log({
            thingName: response.thingName,
          });
          resolve(response.thingName);
        }
        if (error) {
          console.log(error);
          reject(error);
        };
      }
    );

    console.log("Subscribe to RegisterThingRejected.");
    await identity.subscribeToRegisterThingRejected(
      {templateName},
      mqtt.QoS.AtLeastOnce,
      (error, response) => {
        console.log({error, response});
        if (error) reject(error);
      }
    );

    console.log("Publish to RegisterThing.");
    await identity.publishRegisterThing(
      {
        templateName,
        certificateOwnershipToken: token,
        parameters: { thingName }
      },
      mqtt.QoS.AtLeastOnce
    );
  });
  
}

async function main () {
  await provision();
}

main().catch((error) => {
  console.log(error);
})