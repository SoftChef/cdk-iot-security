const {
  readFileSync,
  writeFileSync,
} = require('fs');
const {
  connect,
} = require('mqtt');
const {
  pki,
  md,
} = require('node-forge');

/**
 * Generate the device certificate with CA private key and certificate.
 * @param {*} thingName The desired name for the device.
 * @param {*} caPrivateKeyPem The CA private key in PEM format.
 * @param {*} caCertificatePem The CA certificate in PEM format.
 * @returns 
 */
function getDeviceRegistrationCertificates(thingName, caPrivateKeyPem, caCertificatePem) {
  const deviceKeys = pki.rsa.generateKeyPair(2048);
  let deviceCsr = pki.createCertificationRequest();
  deviceCsr.publicKey = deviceKeys.publicKey;
  deviceCsr.setSubject([{
    name: 'commonName',
    value: thingName,
  }, {
    name: 'countryName',
    value: '',
  }, {
    shortName: 'ST',
    value: '',
  }, {
    name: 'localityName',
    value: '',
  }, {
    name: 'organizationName',
    value: '',
  }, {
    shortName: 'OU',
    value: '',
  }]);
  deviceCsr.sign(deviceKeys.privateKey, md.sha256.create());
  let deviceCertificate = pki.createCertificate();
  const caCertificate = pki.certificateFromPem(caCertificatePem);
  deviceCertificate.setIssuer(caCertificate.subject.attributes);
  deviceCertificate.setSubject(deviceCsr.subject.attributes);
  deviceCertificate.validity.notBefore = new Date();
  deviceCertificate.validity.notAfter.setFullYear(
    deviceCertificate.validity.notBefore.getFullYear() + 1);
  deviceCertificate.publicKey = deviceCsr.publicKey;
  deviceCertificate.sign(pki.privateKeyFromPem(caPrivateKeyPem), md.sha256.create());
  return {
    devicePrivateKeyPem: pki.privateKeyToPem(deviceKeys.privateKey),
    deviceCertificatePem: pki.certificateToPem(deviceCertificate),
  };
}

function main () {
  /**
   * Download AWS IoT Root CA Certificate from https://www.amazontrust.com/repository/AmazonRootCA1.pem
   * and save it as root_ca.cert.pem
   */ 
  const amazonRootCA1 = readFileSync(`${__dirname}/certs/root_ca.cert.pem`).toString();
  const caPrivateKeyPem = readFileSync(`${__dirname}/certs/ca.private_key.pem`).toString();
  const caCertificatePem = readFileSync(`${__dirname}/certs/ca.cert.pem`).toString();

  var settings = readFileSync(`${__dirname}/settings.json`);
  const {
    thingName,
    iotDataEndpoint,
  } = JSON.parse(settings);

  const {
    devicePrivateKeyPem,
    deviceCertificatePem,
  } = getDeviceRegistrationCertificates(thingName, caPrivateKeyPem, caCertificatePem);
  writeFileSync(`${__dirname}/certs/device.private_key.pem`, devicePrivateKeyPem);
  writeFileSync(`${__dirname}/certs/device.cert.pem`, deviceCertificatePem);

  /**
   * Get the endpoint URL through AWS CLI with the following command:
   * aws iot describe-endpoint --endpoint-type iot:Data-ATS
   */
  const options = {
    port: 8883,
    host: iotDataEndpoint,
    key: devicePrivateKeyPem,
    cert: deviceCertificatePem + caCertificatePem,
    rejectUnauthorized: false,
    ca: amazonRootCA1,
    protocol: 'mqtts',
    clientId: `client-${thingName}`,
  };
  const client = connect(options);
  const topic = 'foo/bar';
  client.publish(topic, 'hello', { qos: 1 });
  client.end();
}

main();