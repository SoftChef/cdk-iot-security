'use strict';
const { S3, Iot, CloudWatchLogs } = require('aws-sdk');
const { Request, Response } = require('softchef-utility');
const { Certificates } = require('./certificates');

exports.CaRegistrator = class CaRegistrator {

    errorCodes = {
        errorOfGetRegistrationCode: 411,
        errorOfCaRegistration: 412,
        errorOfCreateIotRule: 413,
        errorOfUnknownVerifier: 414,
        errorOfUploadingResult: 415,
    };

    constructor(event) {
        this.responseBuilder = new Response();
        this.request = new Request(event);
        this.response = null;

        this.region = process.env.AWS_REGION;
        this.verifier = this.request.input('verifier') || {};
        this.bucket = this.request.input("bucket");        
        this.key = this.request.input("key");
        this.csrSubjects = this.request.input("csrSubjects");
        this.caConfig = this.request.input("caConfig");

        this.certificates = {
            ca: {
                keys: {
                    publicKey: null,
                    privateKey: null,
                },
                certificates: null,
            },
            verification: {
                keys: {
                    publicKey: null,
                    privateKey: null,
                },
                certificates: null,
            }
        };

        this.results = {
            registrationCode: null,
            caRegistration: null,
            rule: null,
            upload: null,
        };

        this.iot = new Iot({region: this.region, apiVersion: '2015-05-28'});
        this.cloudwatchLogs = new CloudWatchLogs({region: this.region});
        this.s3 = new S3({region: this.region});
    }

    checkVerifier() {        
        if (this.verifier.arn && process.env[this.verifier.name] !== this.verifier.arn) {
            const err = 'Received unknown verifier';
            console.log(err)
            this.response = this.responseBuilder.error(err, this.errorCodes.errorOfUnknownVerifier);
        } else {
            console.log('Verifier checked');
        }
    }

    checkBucket() {}

    async getRegistrationCode() {
        if (this.response) return;

        const registrationCode = await this.iot.getRegistrationCode({}).promise()
        .then(result => this.results.registrationCode = result.registrationCode)
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfGetRegistrationCode);
            console.log(err, err.stack);
        });
        console.log(`Registration Code: ${registrationCode}`);
        return registrationCode;
    }

    createCertificates() {
        if (this.response) return;
        this.csrSubjects = Object.assign(this.csrSubjects || {},
            {commonName: this.results.registrationCode});
        this.certificates = Certificates.getCaRegistrationCertificates(this.csrSubjects);
        return this.certificates;
    }

    async registerCa() {
        if (this.response) return;
        var params = Object.assign({
            caCertificate: this.certificates.ca.certificate,
            verificationCertificate: this.certificates.verification.certificate,
            allowAutoRegistration: true,
            registrationConfig: {},
            setAsActive: true,
            tags: [{ Key: 'ca', Value: '01' }]
        }, this.caConfig || {});
        return await this.iot.registerCACertificate(params).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfCaRegistration);
            console.log(err, err.stack);
        })
    }

    async createRule() {
        if (this.response) return;
        const caCertificateId = this.results.caRegistration.certificateId;
        
        const logGroupName = `/jitr/clientRegister/${caCertificateId}`;
        await this.cloudwatchLogs.createLogGroup({logGroupName: logGroupName}).promise()
        .catch();

        var log = {
            logGroupName: logGroupName,
            roleArn: process.env.ACTIVATOR_ROLE_ARN,
        };

        var params = {
            ruleName: `ActivationRule_${caCertificateId}`,
            topicRulePayload: {
                actions: [
                    {
                        sqs: {
                            queueUrl: process.env.ACTIVATOR_QUEUE_URL,
                            roleArn: process.env.ACTIVATOR_ROLE_ARN,
                        },
                    },
                    {
                        cloudwatchLogs: log,
                    }
                ],
                errorAction: { cloudwatchLogs: log, },
                sql: `SELECT *, "${this.verifier.arn}" as verifierArn FROM '$aws/events/certificates/registered/${caCertificateId}'`,
            },
        };
        return await this.iot.createTopicRule(params).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfCreateIotRule);
            console.log(err, err.stack);
        })
    }

    async upload() {
        if (this.response) return;
        const table = {
            certificates: this.certificates,
            results: this.results,
        };
        const caCertificateId = this.results.caRegistration.certificateId;
        var params = {
            Bucket: this.bucket,
            Key: `${caCertificateId}/${this.key}`,
            Body: Buffer.from(JSON.stringify(table))
        };
        return await this.s3.upload(params).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfUploadingResult);
            console.log(err, err.stack);
        });
    }

    async register() {
        this.checkVerifier();
        this.checkBucket();
        this.results.registrationCode = await this.getRegistrationCode();
        this.certificates = this.createCertificates();        
        this.results.caRegistration = await this.registerCa();
        this.results.rule = await this.createRule();
        this.results.upload = await this.upload();
        this.response = this.response || this.responseBuilder.json(this.results);
        return this.response;
    }
}