exports.UnknownVerifierError = class UnknownVerifierError extends Error{
    static code = 422;
    constructor() {
        super("Received unknown verifier");
    }
    get code() {
        return UnknownVerifierError.code;
    }
}