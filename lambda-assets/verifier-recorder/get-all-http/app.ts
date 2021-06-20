import {
    InvokeCommand,
    InvokeCommandOutput,
    LambdaClient,
} from '@aws-sdk/client-lambda';
import {
    Response,
} from '@softchef/lambda-events';

export const handler = async (_event: any = {}) : Promise <any> => {
    const response: Response = new Response();
    const getAllVerifierFunctionArn = process.env.GET_ALL_VERIFIER_FUNCTION_ARN;
    
    try {
        let output: InvokeCommandOutput = await new LambdaClient({}).send(new InvokeCommand({
            FunctionName: decodeURIComponent(getAllVerifierFunctionArn),
            Payload: Buffer.from(""),
        }));
        const payload: any = JSON.parse(new TextDecoder().decode(output.Payload));
        const verifiers: any = payload.body;
        return response.json(verifiers);
    } catch (error) {
        return response.error(error);
    }
}