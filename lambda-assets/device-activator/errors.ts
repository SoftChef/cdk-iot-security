export class ParsingVerifyingResultError extends Error {
  static code: number = 500;
  constructor(message?: string) {
    super(message);
  }
  get code() {
    return ParsingVerifyingResultError.code;
  }
}

export class InputError extends Error {
  static code: number = 422;
  constructor(message?: string) {
    super(message);
  }
  get code() {
    return InputError.code;
  }
}