export class UnknownVerifierError extends Error{
    static code: number = 422;
    constructor() {
        super("Received unknown verifier");
    }
    get code(): number {
        return UnknownVerifierError.code;
    }
}