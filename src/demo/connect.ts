import * as fs from 'fs';
import * as mqtt from 'mqtt';

const amazonRootCA1 = fs.readFileSync(`${__dirname}/AmazonRootCA1.pem`);
const file = fs.readFileSync(`${__dirname}/device-certificate.json`).toString();
const deviceCertificates = JSON.parse(file);
const options = {
  port: 8883,
  host: 'a1r289pzzumq0y-ats.iot.us-east-1.amazonaws.com',
  key: deviceCertificates.privateKey,
  cert: deviceCertificates.certificate,
  rejectUnauthorized: false,
  ca: amazonRootCA1,
  protocol: 'mqtts',
  clientId: 'client',
};
const client = mqtt.connect(options);
const topic = 'message';
client.publish(topic, 'hello', {
  qos: 1,
});
client.end();