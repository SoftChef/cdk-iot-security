const { Response } = require('softchef-utility');
const {
  ParsingVerifyingResultError,
  MissingClientCertificateIdError,
} = require('../errors');
const AWS = require('aws-sdk');

/**
 * The lambda function handler activating the client certificates.
 * @param {Object} event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
exports.handler = async (event) => {
  let [ record ] = event.Records;
  record = JSON.parse(record.body);
  certificateId = record.certificateId;
  verifierArn = record.verifierArn;
  verified = verifierArn? false : true;
  results = {
    clientCertificateInfo: null,
    verification: null,
    activation: null,
  };
  
  responseBuilder = new Response();
  let iot = new AWS.Iot();
  let lambda = new AWS.Lambda();
  let response = null; 

  if (!certificateId) {
    throw new MissingClientCertificateIdError();
  }

  var result = await iot.describeCertificate({
    certificateId: certificateId,
  }).promise();
  results.clientCertificateInfo = result;

  if (verifierArn) {
    var result = await lambda.invoke({
      FunctionName: decodeURIComponent(verifierArn),
      Payload: Buffer.from(JSON.stringify(results.clientCertificateInfo)),
    }).promise();

    const payload = JSON.parse(result.Payload);
    const body = JSON.parse(payload.body);
    if (body.verified != true && body.verified != false) {
      throw new ParsingVerifyingResultError();
    }
    verified = body.verified;
    results.verification = body;
  }

  if (verified) {
    var result = await iot.updateCertificate({
      certificateId: certificateId,
      newStatus: 'ACTIVE',
    }).promise();
    results.activation = result;
  }

  response = responseBuilder.json(Object.assign({
    certificateId: certificateId,
    verifierArn: verifierArn,
    verified: verified,
  }, results));
  console.log(response);
  return response;
};