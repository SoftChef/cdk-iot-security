import {
  InputError,
  InformationNotFoundError,
  ServerError,
  VerificationError,
  VerifierError,
} from '../../lambda-assets/errors';

test('Get Error Codes successfully', () => {
  expect(new VerifierError().code).toBe(VerifierError.code);
  expect(new InputError().code).toBe(InputError.code);
  expect(new InformationNotFoundError().code).toBe(InformationNotFoundError.code);
  expect(new VerificationError().code).toBe(VerificationError.code);
  expect(new ServerError().code).toBe(ServerError.code);
});