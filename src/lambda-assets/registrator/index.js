'use strict';
const { CaRegistrator } = require('./caRegistrator');

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
exports.handler = async (event)=>{
    var registrator = new CaRegistrator(event);
    var response = await registrator.register().then();
    return response;
}