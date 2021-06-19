import { Function } from '@aws-cdk/aws-lambda';
import { App, Stack } from '@aws-cdk/core';
import { DeviceActivator } from '../../src/device-activator';
import '@aws-cdk/assert/jest';

test('Initialize the activator function', () => {
  const app = new App();
  const stack = new Stack(app, 'test');
  const deviceActivatorFunction = new DeviceActivator.Function(stack, 'test');
  expect(deviceActivatorFunction).toBeInstanceOf(Function);
});