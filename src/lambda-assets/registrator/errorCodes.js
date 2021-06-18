exports.UnknownVerifierError = class UnknownVerifierError extends Error{
    static code = 411;
    constructor() {
        let message = "Received unknown verifier";
        super(message);
    }
    get code() {
        return UnknownVerifierError.code;
    }
}