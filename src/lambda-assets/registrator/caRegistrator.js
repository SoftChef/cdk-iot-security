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
                certificate: null,
            },
            verification: {
                keys: {
                    publicKey: null,
                    privateKey: null,
                },
                certificate: null,
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

    /**
     * Call the getRegistrationCode API through AWS SDK.
     * @returns The Promise object of calling API.
     */
    getRegistrationCode() {
        return this.iot.getRegistrationCode({}).promise();
    }

    /**
     * Create certificates of CA and verification.
     * This function must run after running function "getRegistrationCode".
     * @returns The created cretificates in PEM form, and the key pairs in PEM form.
     */
    createCertificates() {
        this.csrSubjects = Object.assign(this.csrSubjects || {},
            {commonName: this.results.registrationCode});
        const certificates = Certificates.getCaRegistrationCertificates(this.csrSubjects);
        this.certificates = certificates;
        return certificates;
    }

    /**
     * Call the registerCACertificate API through AWS SDK. 
     * This function must run after running function "createCertificates".
     * @returns The Promise object of calling API.
     */
    async registerCa() {
        var params = Object.assign({
            caCertificate: this.certificates.ca.certificate,
            verificationCertificate: this.certificates.verification.certificate,
            allowAutoRegistration: true,
            registrationConfig: {},
            setAsActive: true,
            tags: [{ Key: 'ca', Value: '01' }]
        }, this.caConfig || {});
        return this.iot.registerCACertificate(params).promise();
    }

    /**
     * Call the createTopicRule API through AWS SDK. 
     * This function must run after running function "registerCa".
     * @returns The Promise object of calling API.
     */
    async createRule() {
        const caCertificateId = this.results.caRegistration.certificateId;
        
        const logGroupName = `/jitr/clientRegister/${caCertificateId}`;
        await this.cloudwatchLogs.createLogGroup({logGroupName: logGroupName}).promise().catch();

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
        return this.iot.createTopicRule(params).promise();
    }

    /**
     * Upload the created certificates and the executing results to the specified S3 Bucket through AWS SDK. 
     * This function must run after running function "createRule".
     * @returns If successfully, return the response from the AWS SDK. Otherwise, undefined.
     */
    async upload() {
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
        return  this.s3.upload(params).promise();
    }

    reset(event) {
        Object.assign(this, new CaRegistrator(event));
    }

    /**
     * Run the whole work flow of registering a CA.
     * @returns The Http response as the function returning for the lambda function.
     */
    /*async register() {
        this.checkVerifier();
        this.checkBucket();
        await this.getRegistrationCode();
        this.createCertificates();
        await this.registerCa();
        await this.createRule();
        await this.upload();
        this.response = this.response || this.responseBuilder.json(this.results);
        return this.response;
    }*/
}