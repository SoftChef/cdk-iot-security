const fs = require('fs');
const { connect } = require('mqtt');

/**
 * Download AWS IoT Root CA Certificate from https://www.amazontrust.com/repository/AmazonRootCA1.pem
 * and save it as root_ca.cert.pem
 */ 
const amazonRootCA1 = fs.readFileSync(`${__dirname}/certs/root_ca.cert.pem`).toString();
const file = fs.readFileSync(`${__dirname}/certs/device-certificate.json`).toString();
const deviceCertificates = JSON.parse(file);

/**
 * Get the endpoint URL through AWS CLI with the following command:
 * aws iot describe-endpoint
 */
const options = {
  port: 8883,
  host: 'your aws iot or aws iot data endpoint',
  key: deviceCertificates.privateKey,
  cert: deviceCertificates.certificate,
  rejectUnauthorized: false,
  ca: amazonRootCA1,
  protocol: 'mqtts',
  clientId: 'client',
};
const client = connect(options);
const topic = 'foo/bar';
client.publish(topic, 'hello', { qos: 1 });
client.end();