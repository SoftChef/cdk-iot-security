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
    const bucket = new Bucket(anotherStack, 'userProvidedBucket');
    new JustInTimeProvision(stack, name, {
      vault: {
        bucket: bucket,
        prefix: 'test',
      },
    });
    expect(SynthUtils.synthesize(stack).template).toMatchSnapshot();
    expect(stack).toCountResources('AWS::Lambda::Function', 2);
    expect(stack).toCountResources('AWS::IAM::Role', 3);
  });
});