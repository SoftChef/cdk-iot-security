import {
  LambdaClient,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import {
  handler,
  httpHandler,
} from '../../../lambda-assets/verifiers-recorder/app';

const verifiers = {
  test_verifier: 'arn:test_verifier_arn',
};

const lambdaMock = mockClient(LambdaClient);

beforeEach(() => {
  process.env.VERIFIERS = JSON.stringify(verifiers);
  lambdaMock.on(InvokeCommand, {
    FunctionName: verifiers.test_verifier,
  }).resolves({
    Payload: new Uint8Array(
      Buffer.from(
        JSON.stringify({ body: JSON.stringify({ verifiers: verifiers }) }),
      ),
    ),
  });
});

describe('Sucessfully execute the handlers', () => {
  test('Handler on regular event', async () => {
    var response = await handler();
    const { verifiers: returned_verifiers } = response;
    expect(JSON.parse(returned_verifiers)).toMatchObject(verifiers);
  });
  test('Http handler on regular event', async () => {
    var response = await httpHandler();
    const { body } = response;
    const { verifiers: returned_verifiers } = JSON.parse(body);
    expect(JSON.parse(returned_verifiers)).toMatchObject(verifiers);
  });
});