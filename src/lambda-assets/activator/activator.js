const AWS = require('aws-sdk');
const { Response } = require('softchef-utility');
const errorCodes = require('./errorCodes');

exports.ClientActivator = class ClientActivator {
  /**
     * Initialize a Client Activator
     * @param {Object} record The AWS SQS message.
     */
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

  /**
     * Check if the client certificate ID is provided or not.
     */
  checkCertificateId() {
    if (!this.certificateId) {
      this.response = this.responseBuilder.error(
        'Missing the client certificate ID',
        errorCodes.missingClientCertificateId,
      );
      console.log('Missing the client certificate ID');
    }
  }

  /**
     * Call the describeCertificate API through AWS SDK.
     * @returns The Promise object of calling API.
     */
  getClientCertificateInfo() {
    return this.iot.describeCertificate({
      certificateId: this.certificateId,
    }).promise();
  }

  /**
     * Call the invoke API through AWS SDK.
     * @returns The Promise object of calling API.
     */
  verify() {
    return this.lambda.invoke({
      FunctionName: decodeURIComponent(this.verifierArn),
      Payload: Buffer.from(JSON.stringify(this.results.clientCertificateInfo)),
    }).promise();
  }

  /**
     * Call the updateCertificate API through AWS SDK.
     * @returns The Promise object of calling API.
     */
  setActive() {
    return this.iot.updateCertificate({
      certificateId: this.certificateId,
      newStatus: 'ACTIVE',
    }).promise();
  }
};