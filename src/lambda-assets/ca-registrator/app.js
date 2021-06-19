const { Request, Response } = require('softchef-utility');
const { UnknownVerifierError } = require('../errors');
const AWS = require('aws-sdk');
const { CertificateGenerator } = require('./certificate-generator');

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
  const request = new Request(event);
  const response = new Response();

  let csrSubjects = request.input('csrSubjects', {});  
  const verifierName = request.input('verifierName');
  const verifierArn = process.env[verifierName];

  const region = process.env.AWS_REGION;
  const iot = new AWS.Iot({ region: region });
  const s3 = new AWS.S3({ region: region });

  const bucketName = process.env.BUCKET_NAME;
  const bucketPrefix = process.env.BUCKET_PREFIX;
  const queueUrl = process.env.DEIVCE_ACTIVATOR_QUEUE_URL;
  const deviceActivatorRoleArn = process.env.DEIVCE_ACTIVATOR_ROLE_ARN;

  let certificates = {
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

  try {
    if (verifierName && !process.env[verifierName]) {
      throw new UnknownVerifierError();
    }

    const registrationCode = await iot.getRegistrationCode({}).promise();
    csrSubjects = Object.assign(csrSubjects, { commonName: registrationCode });

    certificates = CertificateGenerator.getCaRegistrationCertificates(csrSubjects);
    const caRegistration = await iot.registerCACertificate({
      caCertificate: certificates.ca.certificate,
      verificationCertificate: certificates.verification.certificate,
      allowAutoRegistration: true,
      registrationConfig: {},
      setAsActive: true,
      tags: [{ Key: 'ca', Value: '01' }],
    }).promise();

    await iot.createTopicRule({
      ruleName: `ActivationRule_${caRegistration.caCertificateId}`,
      topicRulePayload: {
        actions: [
          {
            sqs: {
              queueUrl: queueUrl,
              roleArn: deviceActivatorRoleArn,
            },
          },
        ],
        sql: `SELECT *, "${verifierArn}" as verifierArn FROM '$aws/events/certificates/registered/${caRegistration.caCertificateId}'`,
      },
    }).promise();

    await s3.upload({
      Bucket: bucketName,
      Key: `${bucketPrefix}/${caRegistration.certificateId}/ca.json`,
      Body: Buffer.from(JSON.stringify(Object.assign({}, certificates, caRegistration))),
    }).promise();

    return response.json(caRegistration);
  } catch (err) {
    console.log(err);
    return response.error(err, err.code);
  }
};