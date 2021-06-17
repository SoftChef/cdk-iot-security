const { Response } = require('softchef-utility');
const { ClientActivator } = require('./activator');
const errorCodes = require('./errorCodes');

/**
 * The lambda function handler activating the client certificates.
 * @param {Object} event The lambda function event, which is a bunch of SQS message.
 * @returns The HTTP response containing the activation results.
 */
exports.handler = async (event) => {
  console.log({ event: event });

  let responses = [];

  for (let record of event.Records) {
    var activator = new ClientActivator(record);
    activator.checkCertificateId();

    if (!activator.response) {
      try {
        var result = await activator.getClientCertificateInfo();
        activator.results.clientCertificateInfo = result;
      } catch (err) {
        activator.response = activator.responseBuilder.error(
          err, errorCodes.errorOfCheckingClientCertificate);
        console.log(err, err.stack);
      }
    }

    if (!activator.response && activator.verifierArn) {
      var result = null;
      try {
        result = await activator.verify();
      } catch (err) {
        activator.response = activator.responseBuilder.error(
          err, errorCodes.errorOfInvokingVerifier);
        console.log(err, err.stack);
      }
      if (result) {
        try {
          const payload = JSON.parse(result.Payload);
          const body = JSON.parse(payload.body);
          if (body.verified != true && body.verified != false) {
            throw new Error('Fail to parse the verifier response: ' + result.Payload);
          }
          activator.verified = body.verified;
          activator.results.verification = body;
        } catch (err) {
          activator.response = activator.responseBuilder.error(
            err, errorCodes.errorOfParsingVerifyingResult);
          console.log(err, err.stack);
        }
      }
    }

    if (!activator.response && activator.verified) {
      try {
        var result = await activator.setActive();
        activator.results.activation = result;
        activator.response = activator.responseBuilder.json(Object.assign({
          certificateId: activator.certificateId,
          verifierArn: activator.verifierArn,
          verified: activator.verified,
        }, activator.results));
        console.log(activator.response);
      } catch (err) {
        activator.response = activator.responseBuilder.error(
          err, errorCodes.failedToActivate);
        console.log(err, err.stack);
      }
    }

    responses.push(activator.response);
  }
  return new Response().json(responses);
};