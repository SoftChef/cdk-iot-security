const { readFileSync } = require('fs');
const { connect } = require('mqtt');
const { pki, md } = require('node-forge');

const amazonRootCA1 = readFileSync(`${__dirname}/certs/root_ca.cert.pem`).toString();
const caPrivateKeyPem = readFileSync(`${__dirname}/certs/ca.private_key.pem`).toString();
const caCertificatePem = readFileSync(`${__dirname}/certs/ca.cert.pem`).toString();
const {
  devicePrivateKeyPem,
  deviceCertificatePem,
} = getDeviceRegistrationCertificates('test_thing', caPrivateKeyPem, caCertificatePem);

const options = {
  port: 8883,
  host: 'your aws iot endpoint',
  key: devicePrivateKeyPem,
  cert: deviceCertificatePem + caCertificatePem,
  rejectUnauthorized: false,
  ca: amazonRootCA1,
  protocol: 'mqtts',
  clientId: 'client',
};
const client = connect(options);
const topic = 'foo/bar';
client.publish(topic, 'hello', { qos: 1 });
client.end();

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