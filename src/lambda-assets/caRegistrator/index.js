const { CaRegistrationHelper } = require('./caRegistrationHelper');
const { Request, Response } = require('softchef-utility');

/**
 * event example
 *
 * event = {
 *  "csrSubjects": {
 *    "commonName": "", // It would be replaced by the registration code, thus is unnecessary.
 *    "countryName": "TW",
 *    "stateName": "TP",
 *    "localityName": "TW",
 *    "organizationName": "Soft Chef",
 *    "organizationUnitName": "web"
 *  },
 *  "verifier": {
 *   "name": "verifier_name",
 *   "arn": "verifier_arn"
 *  }
 *  "bucket": "bucketName",
 *  "key": "objectKey"
 * }
 */

/**
 * The lambda function handler for register CA.
 * @param {Object} event The HTTP request from the API gateway.
 * @returns The HTTP response containing the registration result.
 */
exports.handler = async (event) => {
  responseBuilder = new Response();
  request = new Request(event);

  try {
    var registrator = new CaRegistrationHelper(event);
    registrator.results.registrationCode = await registrator.getRegistrationCode();
    registrator.certificates = registrator.createCertificates();
    registrator.results.caRegistration = await registrator.registerCa();
    registrator.results.rule = await registrator.createRule();
    registrator.results.upload = await registrator.upload();
    response = responseBuilder.json(registrator.results);
  } catch (err) {
    console.log(err);
    response = responseBuilder.error(err, err.code);
  }

  return response;
};