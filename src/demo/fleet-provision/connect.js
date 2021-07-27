const { mqtt, io, iot, iotidentity } = require('aws-iot-device-sdk-v2');
const fs = require('fs');

/**
 * Fill in the template name, endpoint, and thing name before running this file.
 */
const templateName = 'previously generated template name';
const endpoint = 'your aws iot data endpoint';
const thingName = 'your unique thing name';
const clinetId = 'testClient';

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

async function registerThing() {
  
  let token;

  const timer = setTimeout(() => {}, 60 * 1000);
  const clientBootstrap = new io.ClientBootstrap()
  const client = new mqtt.MqttClient(clientBootstrap);
  const config = iot.AwsIotMqttConnectionConfigBuilder
  .new_mtls_builder_from_path(keysPath.provisionClaim.certificate, keysPath.provisionClaim.privateKey)
  .with_certificate_authority_from_path(undefined, keysPath.awsRootCa)
  .with_clean_session(false)
  .with_client_id(clinetId)
  .with_endpoint(endpoint)
  .build();
  const connection = client.new_connection(config);  
  const identity = new iotidentity.IotIdentityClient(connection);  
  await connection.connect();
  
  await identity.subscribeToCreateKeysAndCertificateAccepted(
    {},
    mqtt.QoS.AtLeastOnce,
    (error, response) => {
      if (response) {
        fs.writeFileSync(keysPath.device.info, JSON.stringify({
            certificateId: response.certificateId,
            certificateOwnershipToken: response.certificateOwnershipToken,
            thingName,
        }));
        fs.writeFileSync(keysPath.device.certificate, response.certificatePem);
        fs.writeFileSync(keysPath.device.privateKey, response.privateKey);
        token = response.certificateOwnershipToken;
      }
      if (error) console.log(error);
    }
  );

  await identity.subscribeToCreateKeysAndCertificateRejected(
    {},
    mqtt.QoS.AtLeastOnce,
    (error, response) => console.log({error, response})
  );

  await identity.publishCreateKeysAndCertificate({}, mqtt.QoS.AtLeastOnce);
  
  await identity.subscribeToRegisterThingAccepted(
    {templateName},
    mqtt.QoS.AtLeastOnce,
    (error, response) => {
      if (response) {
        console.log({
          thingName: response.thingName,
        });
        return response.thingName;
      }
      if (error) console.log(error);
    }
  );

  await identity.subscribeToRegisterThingRejected(
    {templateName},
    mqtt.QoS.AtLeastOnce,
    (error, response) => console.log({error, response})
  );

  await identity.publishRegisterThing(
    {
      templateName,
      certificateOwnershipToken: token,
      parameters: { thingName }
    },
    mqtt.QoS.AtLeastOnce
  );

  await connection.disconnect();
  clearTimeout(timer);
}

registerThing();