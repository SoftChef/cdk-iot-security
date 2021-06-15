const { ClientActivator } = require('./activator');

exports.handler = async (event) => {
    console.log({event: event});

    let responses = [];

    for (let record of event.Records) {
        const activator = new ClientActivator(record);
        activator.checkCertificateId();

        if (!activator.response) {
            try {
                var result = await activator.getClientCertificateInfo();
                activator.results.clientCertificateInfo = result || null;
            } catch (err) {
                activator.response = activator.responseBuilder.error(
                    err, activator.errorCodes.errorOfCheckingClientCertificate);
                console.log(err, err.stack);
            }
        }

        if (!activator.response || activator.verifierArn) {
            var result;
            try {
                result = await activator.verify();
            } catch (err) {
                activator.response = activator.responseBuilder.error(
                    err, activator.errorCodes.errorOfInvokingVerifier);
                console.log(err, err.stack);
            }
            if (result) {
                try {
                    const payload = JSON.parse(result.Payload);
                    const body = JSON.parse(payload.body);
                    activator.verified = body.verified;
                    activator.results.verification = body;
                } catch(err) {
                    activator.response = activator.responseBuilder.error(
                        err, activator.errorCodes.errorOfParsingVerifyingResult);
                    console.log(err, err.stack);
                }
            }
        }

        if (!activator.response || !activator.verified) {
            try {
                var result = await activator.setActive();
                activator.results.activation = result || null;
            } catch (err) {
                activator.response = activator.responseBuilder.error(
                    err, activator.errorCodes.failedToActivate);
                console.log(err, err.stack);
            }
        }

        if (!activator.response) {
            activator.response = activator.responseBuilder.json(Object.assign({
                certificateId: activator.certificateId,
                verifierArn: activator.verifierArn,
                verified: activator.verified,
            }, activator.results));
            console.log(activator.response);
        }

        responses.push(activator.response);
    }
    return activator.responseBuilder.json(responses);
}