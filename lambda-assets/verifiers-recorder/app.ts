import {
  Response,
} from '@softchef/lambda-events';

export const handler = async (_event: any = {}) : Promise <any> => {  
  return process.env.VERIFIERS;
};

export const httpHandler = async (_event: any = {}) : Promise <any> => {
  const response: Response = new Response();
  return response.json(JSON.parse(process.env.VERIFIERS));
};