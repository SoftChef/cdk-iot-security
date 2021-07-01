import {
  handler,
} from '../../../lambda-assets/verifiers-fetcher/app';

const verifiers = [
  {
    functionName: 'test_verifier',
    functionArn: 'arn:test_verifier_arn',
  },
];

beforeEach(() => {
  process.env.VERIFIERS = JSON.stringify(verifiers);
});

describe('Sucessfully execute the handlers', () => {
  test('Http handler on regular event', async () => {
    var response = await handler();
    const { body } = response;
    const { verifiers: returned_verifiers } = JSON.parse(body);
    expect(JSON.parse(returned_verifiers)).toMatchObject(verifiers);
  });
});