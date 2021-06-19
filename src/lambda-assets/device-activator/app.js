const { Response } = require('softchef-utility');
const {
  ParsingVerifyingResultError,
  MissingClientCertificateIdError,
} = require('./errors');
const AWS = require('aws-sdk');

/**
 * The lambda function handler activating the client certificates.
 * @param {Object} event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
exports.handler = async (event) => {
  let response = new Response();

  let [ record ] = event.Records;
  record = JSON.parse(record.body);
  
  const certificateId = record.certificateId;
  if (!certificateId) {
    throw new MissingClientCertificateIdError();
  }
  
  const iot = new AWS.Iot();
  const lambda = new AWS.Lambda();

  const clientCertificateInfo = await iot.describeCertificate({
    certificateId: certificateId,
  }).promise();

  const verifierArn = record.verifierArn;
  let verified;
  if (verifierArn) {
    let result = await lambda.invoke({
      FunctionName: decodeURIComponent(verifierArn),
      Payload: Buffer.from(JSON.stringify(clientCertificateInfo)),
    }).promise();    
    const payload = JSON.parse(result.Payload);
    const body = JSON.parse(payload.body);
    if (body.verified !== true && body.verified !== false) {
      throw new ParsingVerifyingResultError();
    }
    verified = body.verified;
  } else {
    verified = true;
  }

  if (verified) {
    await iot.updateCertificate({
      certificateId: certificateId,
      newStatus: 'ACTIVE',
    }).promise();
  }
  
  response = response.json({
    certificateId: certificateId,
    verifierArn: verifierArn,
    verified: verified,
  });
  console.log(response);
  return response;
};