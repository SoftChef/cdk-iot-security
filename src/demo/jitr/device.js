const path = require('path');
const awsIot = require('aws-iot-device-sdk');
const { ThingRegistry } = require('@softchef/iot-just-in-time-registration');

const config = {
  awsIot: {
    endpoint: 'your aws iot data endpoint',
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
  thingRegistry.generateDeviceCertificate('<YourDeviceUniqueName>');
}

let thingShadow = awsIot.thingShadow({
  ...thingRegistry.keysPath,
  host: config.awsIot.endpoint,
  port: config.awsIot.port,
  debug: config.awsIot.debug,
  clientId: `device-${thingRegistry.thingName}`,
});