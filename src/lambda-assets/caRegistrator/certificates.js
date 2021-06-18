'use strict';
const { KeyGenerator } = require('./util');
const forge = require('node-forge');
const { publicKeyToPem, privateKeyToPem, certificateToPem } = require('node-forge').pki;

exports.Certificates = class Certificates {
  /**
     * Get the cetificates for registering a CA.
     * The returned object contains the public key of the CA,
     * the private key of the CA,
     * the certificate of the CA,
     * the public key of the verification,
     * the private key of the verification,
     * and the certificate of the verification.
     * @param {Object} caCertSubjects The object defining the content of CSR subjects.
     * @returns
     */
  static getCaRegistrationCertificates(caCertSubjects) {
    const caKeys = forge.pki.rsa.generateKeyPair(2048);
    const caCertificate = KeyGenerator.generateCACertificate(
      caKeys.publicKey, caKeys.privateKey, caCertSubjects);
    const verificationKeys = forge.pki.rsa.generateKeyPair(2048);
    const verificationCertificate = KeyGenerator.generateVerificationCertificate(
      caKeys.privateKey, caCertificate, verificationKeys);
    const certificates = {
      ca: {
        keys: {
          publicKey: publicKeyToPem(caKeys.publicKey),
          privateKey: privateKeyToPem(caKeys.privateKey),
        },
        certificate: certificateToPem(caCertificate),
      },
      verification: {
        keys: {
          publicKey: publicKeyToPem(verificationKeys.publicKey),
          privateKey: privateKeyToPem(verificationKeys.privateKey),
        },
        certificate: certificateToPem(verificationCertificate),
      },
    };
    return certificates;
  }
};