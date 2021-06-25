import {
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  Response,
} from '@softchef/lambda-events';
import * as Joi from 'joi';

export const handler = async (_event: any = {}) : Promise <any> => {
  const response: Response = new Response();
  const getAllVerifierFunctionArn: string = await Joi.string().regex(/^arn/).required()
    .validateAsync(process.env.GET_ALL_VERIFIER_FUNCTION_ARN);

  try {
    const { Payload: payload = new Uint8Array() } = await new LambdaClient({})
      .send(
        new InvokeCommand({
          FunctionName: decodeURIComponent(getAllVerifierFunctionArn),
          Payload: Buffer.from(''),
        }),
      );
    let payloadString: string = '';
    payload.forEach(num => {
      payloadString += String.fromCharCode(num);
    });
    const { body } = JSON.parse(payloadString);
    const verifiers: any = body;
    return response.json(verifiers);
  } catch (error) {
    return response.error(error);
  }
};