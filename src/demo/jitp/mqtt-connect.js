const { readFileSync } = require("fs");
const { connect } = require("mqtt");

function main() {
  /**
   * Download AWS IoT Root CA Certificate from https://www.amazontrust.com/repository/AmazonRootCA1.pem
   * and save it as root_ca.cert.pem
   */
  const amazonRootCA1 = readFileSync(
    `${__dirname}/certs/root_ca.cert.pem`
  ).toString();
  const devicePrivateKeyPem = readFileSync(
    `${__dirname}/certs/device.private_key.pem`
  ).toString();
  const deviceCertificatePem = readFileSync(
    `${__dirname}/certs/device.cert.pem`
  ).toString();

  var settings = readFileSync(`${__dirname}/settings.json`);
  const { thingName, iotDataEndpoint } = JSON.parse(settings);

  /**
   * Get the endpoint URL through AWS CLI with the following command:
   * aws iot describe-endpoint --endpoint-type iot:Data-ATS
   */
  const options = {
    port: 8883,
    host: iotDataEndpoint,
    key: devicePrivateKeyPem,
    cert: deviceCertificatePem,
    rejectUnauthorized: false,
    ca: amazonRootCA1,
    protocol: 'mqtts',
    clientId: `client-${thingName}`,
  };
  const client = connect(options);
  const topic = "foo/bar";
  client.publish(topic, "hello", { qos: 1 });
  client.end();
}

main();
