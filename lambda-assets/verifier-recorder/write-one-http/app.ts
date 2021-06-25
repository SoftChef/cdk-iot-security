import {
  InvokeCommand,
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
    const { verifierName, verifierArn } = await Joi.object({
      verifierName: Joi.string().required(),
      verifierArn: Joi.string().required(),
    }).validateAsync(request.inputs(['verifierName', 'verifierArn']));

    const { Payload: payload = new Uint8Array() } = await new LambdaClient({})
    .send(
      new InvokeCommand({
        FunctionName: decodeURIComponent(getAllVerifierFunctionArn),
        Payload: Buffer.from(''),
      })
    );
    let payloadString: string = '';
    payload.forEach(num => {
      payloadString += String.fromCharCode(num);
    });
    const { body } = JSON.parse(payloadString);
    const verifiers: any = body;

    verifiers[verifierName] = verifierArn;

    await new LambdaClient({}).send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: decodeURIComponent(getAllVerifierFunctionArn),
        Environment: {
          Variables: { verifiers: verifiers },
        },
      })
    );
    return response.json(verifiers);
  } catch (error) {
    return response.error(error);
  }
};