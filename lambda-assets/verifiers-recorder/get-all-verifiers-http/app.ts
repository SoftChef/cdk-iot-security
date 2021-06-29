import {
    Response,
} from '@softchef/lambda-events';

export const handler = async (_event: any = {}) : Promise <any> => {
    const response: Response = new Response();
    return response.json(
        { verifiers: process.env.VERIFIERS! },
    );
};