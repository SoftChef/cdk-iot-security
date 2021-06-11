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
     * Get the registration code through AWS SDK
     * @returns If successfully, return the response from the AWS SDK. Otherwise, undefined.
     */
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

    /**
     * Create certificates of CA and verification.
     * This function must run after running function "getRegistrationCode".
     * @returns The created cretificates in PEM form, and the key pairs in PEM form.
     */
    createCertificates() {
        if (this.response) return;
        if (!this.results.registrationCode) return;
        this.csrSubjects = Object.assign(this.csrSubjects || {},
            {commonName: this.results.registrationCode});
        const certificates = Certificates.getCaRegistrationCertificates(this.csrSubjects);
        this.certificates = certificates;
        return certificates;
    }

    /**
     * Register a CA through AWS SDK. 
     * This function must run after running function "createCertificates".
     * @returns If successfully, return the response from the AWS SDK. Otherwise, undefined.
     */
    async registerCa() {
        if (this.response) return;
        if (!(
            this.certificates.ca.keys.publicKey &&
            this.certificates.ca.keys.privateKey &&
            this.certificates.ca.certificate &&
            this.certificates.verification.keys.publicKey &&
            this.certificates.verification.keys.privateKey &&
            this.certificates.verification.certificate
            )) {
                console.log("Please run \"createCertificates\" first");
                return;
            };
        var params = Object.assign({
            caCertificate: this.certificates.ca.certificate,
            verificationCertificate: this.certificates.verification.certificate,
            allowAutoRegistration: true,
            registrationConfig: {},
            setAsActive: true,
            tags: [{ Key: 'ca', Value: '01' }]
        }, this.caConfig || {});
        const result = await this.iot.registerCACertificate(params).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfCaRegistration);
            console.log(err, err.stack);
        });
        this.results.caRegistration = result || null;
        return result;
    }

    /**
     * Create a AWS IoT Topic Rule for the previously registered CA through AWS SDK. 
     * This function must run after running function "registerCa".
     * @returns If successfully, return the response from the AWS SDK. Otherwise, undefined.
     */
    async createRule() {
        if (this.response) return;
        if (!this.results.caRegistration) {
            console.log("Please run \"registerCa\" first");
            return;
        }
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
        const result = await this.iot.createTopicRule(params).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfCreateIotRule);
            console.log(err, err.stack);
        });
        this.results.rule = result || null;
        return result;
    }

    /**
     * Upload the created certificates and the executing results to the specified S3 Bucket through AWS SDK. 
     * This function must run after running function "createRule".
     * @returns If successfully, return the response from the AWS SDK. Otherwise, undefined.
     */
    async upload() {
        if (this.response) return;
        if (this.results.rule === null || !this.results.caRegistration) {
            console.log("Please run \"registerCa\" and \"createRule\" first");
            return;
        }
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
        const result = await this.s3.upload(params).promise()
        .catch(err => {
            this.response = this.responseBuilder.error(
                err, this.errorCodes.errorOfUploadingResult);
            console.log(err, err.stack);
        });
        this.results.upload = result || null;
        return result;
    }

    /**
     * Run the whole work flow of registering a CA.
     * @returns The Http response as the function returning for the lambda function.
     */
    async register() {
        this.checkVerifier();
        this.checkBucket();
        await this.getRegistrationCode();
        this.createCertificates();        
        await this.registerCa();
        await this.createRule();
        await this.upload();
        this.response = this.response || this.responseBuilder.json(this.results);
        return this.response;
    }

    /*get response() {
        if (
            this.results.registrationCode !== null &&
            this.results.caRegistration !== null &&
            this.results.rule !== null &&
            this.results.upload !== null
        ) {
            this.response = this.responseBuilder.json(this.results);
        }
        return this.response;
    }

    set response(value) {
        this.response = value;        
    }*/
}