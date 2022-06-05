import * as path from 'path';
import {
  App,
  Stack,
} from 'aws-cdk-lib';
import {
  Bucket,
} from 'aws-cdk-lib/aws-s3';
import {
  CaRegistrator,
  DeviceActivator,
  VerifiersFetcher,
  ReviewReceptor,
  ReviewAcceptionRole,
  JitrTopicRule,
  FleetGenerator,
  FleetProvisioningRole,
  RegistrationConfigRole,
  DeviceCertificateGenerator,
  ProvisionRole,
  GreenGrassV2TokenExchangeRole,
} from '../../src/index';

describe('Test index.ts exportation', () => {
  test('Create Functions', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const anotherStack = new Stack(app, 'another-stack');
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new DeviceActivator(stack, 'testDeviceActivator');
    new VerifiersFetcher(stack, 'testVerifiersFetcher');
    new CaRegistrator(stack, 'testCaRegistrationFunction', {
      vault: {
        bucket: bucket,
      },
    });
    new DeviceCertificateGenerator(stack, 'testDeviceCertificateGenerator', {
      vault: {
        bucket: bucket,
      },
    });
    const reviewReceptor = new ReviewReceptor(stack, 'testReviewReceptor');
    new ReviewAcceptionRole(reviewReceptor, 'testReviewAcceptionRole', 'iot.amazonaws.com');
    new JitrTopicRule(reviewReceptor, 'testJitrTopicRule');
    new FleetGenerator(stack, 'testFleetGenerator', {
      vault: {
        bucket: bucket,
      },
      fleetProvisionRole: new FleetProvisioningRole(stack, 'testFleetProvisionRole'),
    });
    new RegistrationConfigRole(stack, 'testJitpRole');
    new ProvisionRole(stack, 'testProvisionRole');
    new GreenGrassV2TokenExchangeRole(stack, 'testGreenGrassV2TokenExchangeRole');
  });
});
