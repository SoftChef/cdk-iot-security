export class VerificationError extends Error {
  static code: number = 500;
  constructor(message?: string) {
    super(message);
  }
  get code() {
    return VerificationError.code;
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

export class PemParsingError extends Error {
  static code: number = 422;
  constructor(message?: string) {
    super(message);
  }
  get code() {
    return PemParsingError.code;
  }
}

export class CertificateNotFounderror extends Error {
  static code: number = 404;
  constructor(message?: string) {
    super(message);
  }
  get code() {
    return CertificateNotFounderror.code;
  }
}