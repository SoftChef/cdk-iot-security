"use strict";
const forge = require('node-forge');

exports.KeyGenerator = class KeyGenerator {
    static generateKeys() {
        return forge.pki.rsa.generateKeyPair(2048);
    }
    static generateCertificateTemplate(attr, years) {
        let certificate = forge.pki.createCertificate();
        certificate.setSubject(attr);
        certificate.setIssuer(attr);
        certificate.validity.notBefore = new Date();
        certificate.validity.notAfter = new Date();
        certificate.validity.notAfter.setFullYear(
            certificate.validity.notBefore.getFullYear() + years);
        return certificate;
    }
    static generateCACertificate(publicKey, privateKey, certificateSubjects) {
        let attrs = this.formattedSubjects(certificateSubjects);
        let caCertificate = this.generateCertificateTemplate(attrs, 1);
        caCertificate.publicKey = publicKey;
        caCertificate.serialNumber = '01';
        caCertificate.setExtensions([{
            name: 'basicConstraints',
            cA: true
        }, {
            name: 'subjectKeyIdentifier'
        }, {
            name: 'authorityKeyIdentifier',
            keyIdentifier: true
        }]);
        caCertificate.sign(privateKey);
        return caCertificate;
    }
    static generateVerificationCertificate(caPrivateKey, caCertificate, verificationKeys) {
        let attrs = caCertificate.subject.attributes;
        let certificate = this.generateCertificateTemplate(attrs, 25);
        certificate.publicKey = verificationKeys.publicKey;
        certificate.sign(caPrivateKey, forge.md.sha256.create());
        return certificate;
    }
    static formattedSubjects(props) {
        return [{
            name: 'commonName',
            value: props.commonName || ""
        }, {
            name: 'countryName',
            value: props.countryName || ""
        }, {
            shortName: 'ST',
            value: props.stateName || ""
        }, {
            name: 'localityName',
            value: props.localityName || ""
        }, {
            name: 'organizationName',
            value: props.organizationName || ""
        }, {
            shortName: 'OU',
            value: props.organizationUnitName || ""
        }];
    }
    static getCaRegistrationCertificates(caCertSubjects) {
        const caKeys = this.generateKeys();
        const caCertificate = this.generateCACertificate(
            caKeys.publicKey, caKeys.privateKey, caCertSubjects);
        const verificationKeys = this.generateKeys();
        const verificationCertificate = this.generateVerificationCertificate(
            caKeys.privateKey, caCertificate, verificationKeys);
        const certificates = {
            ca: {
                keys: caKeys,
                certificate: caCertificate
            },
            verification: {
                keys: verificationKeys,
                certificate: verificationCertificate
            }
        };
        return certificates;
    }
}