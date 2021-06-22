import {
  InvokeCommand,
  InvokeCommandOutput,
  LambdaClient,
  UpdateFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import {
  Request,
  Response,
} from '@softchef/lambda-events';
import * as Joi from 'joi';

export const handler = async (event: any = {}) : Promise <any> => {
  const request: Request = new Request(event);
  const response: Response = new Response();
  const getAllVerifierFunctionArn: string = await Joi.string().regex(/^arn/).required()
    .validateAsync(process.env.GET_ALL_VERIFIER_FUNCTION_ARN);

  try {
    const verifierName: string = await Joi.string().required().validateAsync(request.parameter('verifierName'));

    let output: InvokeCommandOutput = await new LambdaClient({}).send(new InvokeCommand({
      FunctionName: decodeURIComponent(getAllVerifierFunctionArn),
      Payload: Buffer.from(''),
    }));
    const payload: any = JSON.parse(new TextDecoder().decode(output.Payload));
    const verifiers: any = payload.body;

    delete verifiers[verifierName];

    await new LambdaClient({}).send(new UpdateFunctionConfigurationCommand({
      FunctionName: decodeURIComponent(getAllVerifierFunctionArn),
      Environment: {
        Variables: { verifiers: verifiers },
      },
    }));
    return response.json(verifiers);
  } catch (error) {
    return response.error(error);
  }
};