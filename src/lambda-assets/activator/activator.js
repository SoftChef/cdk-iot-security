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
        console.log('check cert: ' + this.certificateId);
        if (!this.certificateId) {
            this.response = this.responseBuilder.error(
                'Missing the client certificate ID',
                this.errorCodes.missingClientCertificateId
            );
            console.log('Missing the client certificate ID');
        }
    }

    async getClientCertificateInfo() {
        if (this.response !== null) return;
        const result = await this.iot.describeCertificate({
            certificateId: this.certificateId,
        }).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfCheckingClientCertificate);
            console.log(err, err.stack);
        });
        this.results.clientCertificateInfo = result;
        return result;
    }

    async verify() {
        if (this.response !== null) return;
        if (!this.verifierArn) return;
        await this.lambda.invoke({
            FunctionName: decodeURIComponent(this.verifierArn), 
            Payload: Buffer.from(JSON.stringify(this.results.clientCertificateInfo)),
        }).promise()
        .then(result => {
            try {
                const payload = JSON.parse(result.Payload);
                const body = JSON.parse(payload.body);
                this.verified = body.verified;
            } catch(err) {
                this.response = this.responseBuilder.error(
                    err, this.errorCodes.errorOfParsingVerifyingResult);
                console.log(err, err.stack);
            }
        })
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfInvokingVerifier);
            console.log(err, err.stack);
        });
        return this.verified;
    }

    async updateCertificate() {
        if (this.response !== null) return;
        if (!this.verified) return;
        const result = await this.iot.updateCertificate({
            certificateId: this.certificateId,
            newStatus: "ACTIVE"
        }).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfInvokingVerifier);
            console.log(err, err.stack);
        });
        this.results.activation = result;
    }

    async activate() {
        this.checkCertificateId();
        await this.getClientCertificateInfo();
        await this.verify();
        await this.updateCertificate();
        this.response = this.responseBuilder.json(Object.assign({
            certificateId: this.certificateId,
            verifierArn: this.verifierArn,
            verified: this.verified,
        }, this.results));
        console.log(this.response);
        return this.response;
    }
}