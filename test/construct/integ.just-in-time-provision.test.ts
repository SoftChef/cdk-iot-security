import * as path from 'path';
import '@aws-cdk/assert/jest';
import { SynthUtils } from '@aws-cdk/assert';
import { Bucket } from '@aws-cdk/aws-s3';
import { App, Stack } from '@aws-cdk/core';
import { JustInTimeProvision } from '../../src';

describe('Integration test', () => {
  test('JustInTimeProvision', () => {
    process.env.BASE_PATH = __dirname;
    process.env.APPS_PATH = path.resolve(__dirname, '..', '..', 'src', 'lambda-assets');
    const app = new App();
    const stack = new Stack(app, 'test-stack');
    const name = 'test-case';
    const anotherStack = new Stack(app, 'another-stack');
    const caBucket = new Bucket(anotherStack, 'caBucket');
    const deviceVault = new Bucket(anotherStack, 'deviceBucket');
    new JustInTimeProvision(stack, name, {
      vault: {
        bucket: caBucket,
        prefix: 'test',
      },
      deviceVault: {
        bucket: deviceVault,
      },
    });
    expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
    expect(stack).toCountResources('AWS::Lambda::Function', 3);
    expect(stack).toCountResources('AWS::IAM::Role', 4);
  });
});