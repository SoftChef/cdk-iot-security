"use strict";
const forge = require('node-forge');
const { KeyGenerator } = require('./util');
const { publicKeyToPem, privateKeyToPem, certificateToPem } = require('node-forge').pki;

exports.Certificates = class Certificates {
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
                    privateKey: privateKeyToPem(caKeys.privateKey)
                },
                certificate: certificateToPem(caCertificate)
            },
            verification: {
                keys: {
                    publicKey: publicKeyToPem(verificationKeys.publicKey),
                    privateKey: privateKeyToPem(verificationKeys.privateKey)
                },
                certificate: certificateToPem(verificationCertificate)
            }
        };
        return certificates;
    }
}