export class ParsingVerifyingResultError extends Error {
    static code: number = 500;
    constructor() {
        super("Fail to parse the response return by the verifier lambda function.");
    }
    get code() {
        return ParsingVerifyingResultError.code;
    }
}

export class MissingClientCertificateIdError extends Error {
    static code: number = 415;
    constructor() {
        super("The message is lack of the client certificate ID.");
    }
    get code() {
        return MissingClientCertificateIdError.code;
    }
}