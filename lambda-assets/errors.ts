export class CodedError extends Error {
  static code: number = 400;
  get code() {
    return Object.getPrototypeOf(this).constructor.code;
  }
}

export class InputError extends CodedError {
  static code: number = 422;
}

export class InformationNotFoundError extends CodedError {
  static code: number = 404;
}

export class ServerError extends CodedError {
  static code: number = 500;
}

export class VerifierError extends InputError {}

export class VerificationError extends ServerError {}