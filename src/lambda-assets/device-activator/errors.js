exports.ParsingVerifyingResultError = class ParsingVerifyingResultError extends Error {
    static code = 500;
    constructor() {
        super("Fail to parse the response return by the verifier lambda function.");
    }
    get code() {
        return ParsingVerifyingResultError.code;
    }
}

exports.MissingClientCertificateIdError = class MissingClientCertificateIdError extends Error {
    static code = 415;
    constructor() {
        super("The message is lack of the client certificate ID.");
    }
    get code() {
        return MissingClientCertificateIdError.code;
    }
}