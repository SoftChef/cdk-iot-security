import {
    InvokeCommand,
    InvokeCommandOutput,
    LambdaClient,
} from '@aws-sdk/client-lambda';
import {
    Request,
    Response,
} from '@softchef/lambda-events';
import * as Joi from 'joi';

export const handler = async (event: any = {}) : Promise <any> => {
    const request: Request = new Request(event);
    const response: Response = new Response();
    const getAllVerifierFunctionArn = process.env.GET_ALL_VERIFIER_FUNCTION_ARN;
    
    try {        
        const verifierName: string = await Joi.string().required().validateAsync(request.input('verifierName'));
        
        let output: InvokeCommandOutput = await new LambdaClient({}).send(new InvokeCommand({
            FunctionName: decodeURIComponent(getAllVerifierFunctionArn),
            Payload: Buffer.from(""),
        }));
        const payload: any = JSON.parse(new TextDecoder().decode(output.Payload));
        const verifiers: any = payload.body;
        
        const verifierArn: string = await Joi.string().regex(/^arn:/).validateAsync(verifiers[verifierName])
        return response.json({ verifierArn: verifierArn });
    } catch (error) {
        return response.json({});
    }
}