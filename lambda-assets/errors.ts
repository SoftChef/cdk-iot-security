export class InputError extends Error {
  static code: number = 422;
  get code() {
    return Object.getPrototypeOf(this).constructor.code;
  }
}

export class InformationNotFoundError extends Error {
  static code: number = 404;
  get code() {
    return Object.getPrototypeOf(this).constructor.code;
  }
}

export class ServerError extends Error {
  static code: number = 500;
  get code() {
    return Object.getPrototypeOf(this).constructor.code;
  }
}

export class VerifierError extends InputError {}

export class VerificationError extends ServerError {}

export class TemplateBodyPolicyDocumentMalformed extends InputError {}