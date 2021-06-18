const AWS = require('aws-sdk');
const { Request } = require('softchef-utility');
const { CertificateGenerator } = require('./certificateGenerator');
const { UnknownVerifierError } = require('../errors');

exports.CaRegistrationHelper = class CaRegistrationHelper {
  /**
   * Initialize the CA Registration Helper.
   * @param {Object} event The lambda function event
   */
  constructor(verifierName, csrSubjects) {    
    this.verifierName = verifierName
    this.verifierArn = process.env[this.verifierName];
    this.region = process.env.AWS_REGION;
    this.bucketName = process.env.BUCKET_NAME;
    this.bucketPrefix = process.env.BUCKET_PREFIX;
    this.bucketKey = process.env.BUCKET_KEY;
    this.csrSubjects = csrSubjects
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
      },
    };

    this.results = {
      registrationCode: null,
      caRegistration: null,
      rule: null,
      upload: null,
    };

    this.iot = new AWS.Iot({ region: this.region });
    this.cloudwatchLogs = new AWS.CloudWatchLogs({ region: this.region });
    this.s3 = new AWS.S3({ region: this.region });
  }

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
    this.csrSubjects = Object.assign(
      this.csrSubjects, { commonName: this.results.registrationCode });
    const certificates = CertificateGenerator.getCaRegistrationCertificates(this.csrSubjects);
    this.certificates = certificates;
    return certificates;
  }

  /**
     * Call the registerCACertificate API through AWS SDK.
     * This function must run after running function "createCertificates".
     * @returns The Promise object of calling API.
     */
  async registerCa() {
    var params = {
      caCertificate: this.certificates.ca.certificate,
      verificationCertificate: this.certificates.verification.certificate,
      allowAutoRegistration: true,
      registrationConfig: {},
      setAsActive: true,
      tags: [{ Key: 'ca', Value: '01' }],
    };
    return this.iot.registerCACertificate(params).promise();
  }

  /**
     * Call the createTopicRule API through AWS SDK.
     * @returns The Promise object of calling API.
     */
  async createRule() {
    const caCertificateId = this.results.caRegistration.certificateId;
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
        ],
        sql: `SELECT *, "${this.verifierArn}" as verifierArn FROM '$aws/events/certificates/registered/${caCertificateId}'`,
      },
    };
    return this.iot.createTopicRule(params).promise();
  }

  /**
     * Call the upload API through AWS SDK.
     * @returns The Promise object of calling API.
     */
  upload() {
    const table = {
      certificates: this.certificates,
      results: this.results,
    };
    const caCertificateId = this.results.caRegistration.certificateId;
    var params = {
      Bucket: this.bucketName,
      Key: `${this.bucketPrefix}/${caCertificateId}/ca.json`,
      Body: Buffer.from(JSON.stringify(table)),
    };
    return this.s3.upload(params).promise();
  }
};