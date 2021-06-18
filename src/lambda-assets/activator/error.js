exports.ParsingVerifyingResultError = class ParsingVerifyingResultError extends Error {
    static code = 500;
    constructor() {
        let message = "Fail to parse the response return by the verifier lambda function.";
        super(message);
    }
    get code() {
        return ParsingVerifyingResultError.code;
    }
}

exports.MissingClientCertificateIdError = class MissingClientCertificateIdError extends Error {
    static code = 415;
    constructor() {
        let message = " The message is lack of the client certificate ID."
        super(message);
    }
    get code() {
        return MissingClientCertificateIdError.code;
    }
}