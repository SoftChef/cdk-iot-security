import { Response }  from '@softchef/lambda-events';
import {
    ParsingVerifyingResultError,
    MissingClientCertificateIdError
} from './errors';
import {
    DescribeCertificateCommand,
    UpdateCertificateCommand,
    IoTClient,
    DescribeCertificateCommandOutput
} from '@aws-sdk/client-iot'
import {
    InvokeCommand,
    InvokeCommandOutput,
    LambdaClient
} from '@aws-sdk/client-lambda'

/**
 * The lambda function handler activating the client certificates.
 * @param event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
 export const handler = async (event: any = {}) : Promise <any> => {
  let response: Response = new Response();

  let [ record ] = event.Records;
  record = JSON.parse(record.body);
  
  const certificateId: string = record.certificateId;
  if (!certificateId) {
    throw new MissingClientCertificateIdError();
  }
  
  const iotClient: IoTClient = new IoTClient({});
  const lambdaClient: LambdaClient = new LambdaClient({});

  const clientCertificateInfo: DescribeCertificateCommandOutput = await iotClient.send(new DescribeCertificateCommand({
    certificateId: certificateId,
  }));

  const verifierArn: string = record.verifierArn;
  let verified: boolean;
  if (verifierArn) {
    let result: InvokeCommandOutput = await lambdaClient.send(new InvokeCommand({
        FunctionName: decodeURIComponent(verifierArn),
        Payload: Buffer.from(JSON.stringify(clientCertificateInfo)),  
    }));
    
    const payload: any = JSON.parse(new TextDecoder().decode(result.Payload));
    if (payload.body.verified !== true && payload.body.verified !== false) {
      throw new ParsingVerifyingResultError();
    }
    verified = payload.body.verified;
  } else {
    verified = true;
  }

  if (verified) {
    await iotClient.send(new UpdateCertificateCommand({
        certificateId: certificateId,
        newStatus: 'ACTIVE',    
    }));
  }
  
  const message: any = response.json({
    certificateId: certificateId,
    verifierArn: verifierArn,
    verified: verified,
  });
  console.log(message);
  return message;
};