const { readFileSync } = require('fs');
const path = require('path');
const awsIot = require('aws-iot-device-sdk');
const { ThingRegistry } = require('@softchef/iot-just-in-time-registration');

var settings = readFileSync(`${__dirname}/settings.json`);
const {
  thingName,
  iotDataEndpoint,
} = JSON.parse(settings);

const config = {
  awsIot: {
    endpoint: iotDataEndpoint,
    port: '8883', // 8883 or 1883 is default supported with AWS IoT,
    debug: true,
  },
};

const thingRegistry = new ThingRegistry();

// you can change the default certificates folder
thingRegistry.setCertsPath(
  path.resolve(__dirname, './certs'),
);

if (!thingRegistry.hasDeviceCertificate) {
  thingRegistry.generateDeviceCertificate(thingName);
}

let thingShadow = awsIot.thingShadow({
  ...thingRegistry.keysPath,
  host: config.awsIot.endpoint,
  port: config.awsIot.port,
  debug: config.awsIot.debug,
  clientId: `device-${thingRegistry.thingName}`,
});