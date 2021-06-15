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
exports.handler = async (event) => {
    var registrator = new CaRegistrator(event);
    
    registrator.checkVerifier();
    registrator.checkBucket();

    if (!registrator.response) {
        try {
            const { registrationCode } = await registrator.getRegistrationCode();
            registrator.results.registrationCode = registrationCode;
            console.log(`Registration Code: ${registrationCode}`);
        } catch(err) {
            registrator.response = registrator.responseBuilder.error(
                err, registrator.errorCodes.errorOfGetRegistrationCode);
            console.log(err, err.stack);
        }
    }

    if (!registrator.response && registrator.results.registrationCode) {
        registrator.createCertificates();
    }
    
    if (!registrator.response) {
        if (!(
            registrator.certificates.ca.keys.publicKey &&
            registrator.certificates.ca.keys.privateKey &&
            registrator.certificates.ca.certificate &&
            registrator.certificates.verification.keys.publicKey &&
            registrator.certificates.verification.keys.privateKey &&
            registrator.certificates.verification.certificate
        )) {
            console.log("Please run \"createCertificates\" first");
        } else {
            try {
                const result = await registrator.registerCa();
                registrator.results.caRegistration = result || null;
            } catch (err) {
                registrator.response = registrator.responseBuilder.error(
                    err, registrator.errorCodes.errorOfCaRegistration);
                console.log(err, err.stack);
            }
        }
    }

    if (!registrator.response) {
        if (!registrator.results.caRegistration) {
            console.log("Please run \"registerCa\" first");
        } else {
            try {
                const result = await registrator.createRule();
                registrator.results.rule = result || null;
            } catch (err) {
                registrator.response = registrator.responseBuilder.error(
                    err, registrator.errorCodes.errorOfCreateIotRule);
                console.log(err, err.stack);
            }
        }
    }

    if (!registrator.response) {
        if (registrator.results.rule === null || !registrator.results.caRegistration) {
            console.log("Please run \"registerCa\" and \"createRule\" first");
        } else {
            try {
                const result = await registrator.upload();
                this.results.upload = result || null;
            } catch (err) {
                registrator.response = registrator.responseBuilder.error(
                    err, registrator.errorCodes.errorOfUploadingResult);
                console.log(err, err.stack);
            }
        }
    }

    registrator.response = registrator.response || registrator.responseBuilder.json(registrator.results);    
    return response;
}