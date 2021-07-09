import {
    S3Client,
    GetObjectCommand,
} from '@aws-sdk/client-s3'
import {
    Request,
    Response,
} from '@softchef/lambda-events'

export const handler = async (event: any = {}) : Promise <any> => {
    const request = new Request(event);
    const response = new Response();
    try {
        const {  } = await new S3Client({}).send(
            new GetObjectCommand({
                Bucket: '',
                Key: '',
            })
        )
        return response.json({});
    } catch (error) {
        return response.error(error);
    }
}