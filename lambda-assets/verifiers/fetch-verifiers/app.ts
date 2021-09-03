import {
  Response,
} from '@softchef/lambda-events';

/**
 * The lambda function handler returning the verifiers' name.
 * @param _event The HTTP request body. It is not considered to have any required content.
 * @returns All the verifiers' name.
 */
export const handler = async (_event: any = {}) : Promise <any> => {
  const response: Response = new Response();
  return response.json(
    { verifiers: process.env.VERIFIERS! },
  );
};