export class VerifierError extends Error {
  static code: number = 423;
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

export class InformationNotFoundError extends Error {
  static code: number = 404;
  constructor(message?: string) {
    super(message);
  }
  get code(): number {
    return InformationNotFoundError.code;
  }
}