'use strict';
const { CaRegistrator } = require('./caRegistrator');

/**
 * event example
 * 
 * event = {
 *  "csrSubjects": {
 *    "commonName": "",
 *    "countryName": "TW",
 *    "stateName": "TP",
 *    "localityName": "TW",
 *    "organizationName": "Soft Chef",
 *    "organizationUnitName": "web"
 *  },
 *  "verifierArn": "...",
 *  "bucket": "bucketName",
 *  "key": "objectKey"
 * }
 */

exports.handler = async (event)=>{
    var registrator = new CaRegistrator(event);
    var response = await registrator.register().then();
    return response;
}