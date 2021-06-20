export class VerifierError extends Error {
  static code: number = 422;
  constructor(message?: string) {
    super(message);
  }
  get code(): number {
    return VerifierError.code;
  }
}

export class InputError extends Error {
  static code: number = 422;
  constructor(message?: string) {
    super(message);
  }
  get code(): number {
    return InputError.code;
  }
}