const AWS = require('aws-sdk');
const { Response } = require('softchef-utility');

exports.ClientActivator = class ClientActivator {
    errorCodes = {
        errorOfCheckingClientCertificate: 410,
        errorOfInvokingVerifier: 411,
        errorOfParsingVerifyingResult: 412,
        errorOfActivating: 413,
        failedToActivate: 414,
        missingClientCertificateId: 415,
    };

    constructor(record) {
        console.log(record);
        this.record = JSON.parse(record.body);
        this.response = null;
        this.responseBuilder = new Response();
        this.iot = new AWS.Iot();
        this.lambda = new AWS.Lambda();
        this.certificateId = this.record.certificateId;
        this.verifierArn = this.record.verifierArn;
        this.verified = this.verifierArn? false : true;
        this.results = {
            clientCertificateInfo: null,
            verification: null,
            activation: null,
        };
    }

    checkCertificateId() {
        if (!this.certificateId) {
            this.response = this.responseBuilder.error(
                'Missing the client certificate ID',
                this.errorCodes.missingClientCertificateId
            );
            console.log('Missing the client certificate ID');
        }
    }

    getClientCertificateInfo() {
        return this.iot.describeCertificate({
            certificateId: this.certificateId,
        }).promise();
    }

    verify() {
        return this.lambda.invoke({
            FunctionName: decodeURIComponent(this.verifierArn), 
            Payload: Buffer.from(JSON.stringify(this.results.clientCertificateInfo)),
        }).promise();
    }

    async setActive() {
        return this.iot.updateCertificate({
            certificateId: this.certificateId,
            newStatus: "ACTIVE"
        }).promise();
    }
}