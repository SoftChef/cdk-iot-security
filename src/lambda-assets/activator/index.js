const AWS = require('aws-sdk');
const { Response } = require('softchef-utility');

const errorCodes = {
    errorOfCheckingClientCertificate: 410,
    errorOfInvokingVerifier: 411,
    errorOfParsingVerifyingResult: 412,
    errorOfActivating: 413,
    failedToActivate: 414,
    missingClientCertificateId: 415,
};

exports.handler = async (event) => {
    console.log({event: event});
    for (let record of event.Records) {
        await activateClientCertificate(JSON.parse(record.body));
    }
}

async function activateClientCertificate(record) {
    let response = null;
    let responseBuilder = new Response();
    console.log({record: record});

    const certificateId = record.certificateId;
    if (!certificateId) {
        response = responseBuilder.err(
            'Missing the client certificate ID',
            errorCodes.missingClientCertificateId
        );
        console.log(response)
        return response;
    }

    let verified = true;
    
    const iot = new AWS.Iot();
    const verifierArn = record.verifierArn || null;
    if (verifierArn) {
        const clientCertificateInfo = await iot.describeCertificate({
            certificateId: certificateId,
        }).promise()
        .catch(err => response = responseBuilder.err(
            err,
            errorCodes.errorOfCheckingClientCertificate
        ));
        if (response) {
            console.log(response);
            return response
        };

        const lambda = new AWS.Lambda();
        const verifierResult = await lambda.invoke({
            FunctionName: decodeURIComponent(verifierArn), 
            Payload: Buffer.from(JSON.stringify(clientCertificateInfo)),
        }).promise()
        .catch(err => response = responseBuilder.err(
            err,
            errorCodes.errorOfInvokingVerifier
        ));
        if (response) {
            console.log(response);
            return response
        };

        try {
            const payload = JSON.parse(verifierResult.Payload);
            const body = JSON.parse(payload.body);
            verified = body.verified || false;
        } catch(err) {
            response = responseBuilder.err(
                err,
                errorCodes.errorOfParsingVerifyingResult
            );
            console.log(response);
            return response;
        }
    }

    let activationResult = null;
    if (verified) {
        activationResult = await iot.updateCertificate({
            certificateId: certificateId,
            newStatus: "ACTIVE"
        }).promise()
        .catch(err => response = responseBuilder.err(
            err,
            errorCodes.errorOfInvokingVerifier
        ));
        if (response) {
            console.log(response);
            return response
        };
    } 

    response = responseBuilder.json({
        certificateId: certificateId,
        verifierArn: verifierArn,
        verified: verified,
        activationResult: activationResult,
    });
    console.log(response);
    return response;
}