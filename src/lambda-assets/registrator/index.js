const { CaRegistrator } = require('./caRegistrator');
const errorCodes = require('./errorCodes');

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
  var registrator = new CaRegistrator(event);

  registrator.checkVerifier();

  try {
    const { registrationCode } = await registrator.getRegistrationCode();
    console.log(`Registration Code: ${registrationCode}`);
    registrator.results.registrationCode = registrationCode;
  } catch (err) {
    registrator.response = registrator.responseBuilder.error(
      err, errorCodes.errorOfGetRegistrationCode);
    console.log(err, err.stack);
  }

  if (!registrator.response) {
    await registrator.checkBucket();
  }

  if (!registrator.response) {
    registrator.createCertificates();
  }

  if (!registrator.response) {
    try {
      const result = await registrator.registerCa();
      console.log('CA Registration: ' + JSON.stringify(result));
      registrator.results.caRegistration = result;
    } catch (err) {
      registrator.response = registrator.responseBuilder.error(
        err, errorCodes.errorOfCaRegistration);
      console.log(err, err.stack);
    }
  }

  if (!registrator.response) {
    try {
      const result = await registrator.createRule();
      console.log('Create Rule: ' + JSON.stringify(result));
      registrator.results.rule = result;
    } catch (err) {
      registrator.response = registrator.responseBuilder.error(
        err, errorCodes.errorOfCreateIotRule);
      console.log(err, err.stack);
    }
  }

  if (!registrator.response) {
    try {
      const result = await registrator.upload();
      console.log('Upload: ' + JSON.stringify(result));
      registrator.results.upload = result;
    } catch (err) {
      registrator.response = registrator.responseBuilder.error(
        err, errorCodes.errorOfUploadingResult);
      console.log(err, err.stack);
    }
  }

  registrator.response = registrator.response || registrator.responseBuilder.json(registrator.results);
  return registrator.response;
};