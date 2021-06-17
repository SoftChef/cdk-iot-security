'use strict';
const forge = require('node-forge');

exports.KeyGenerator = class KeyGenerator {
  /**
     * Generate a certificate template which can be further
     * used to generate a CA or a verification certificate.
     * @param {array} attr The formatted CSR subject.
     * @param {Number} years The valid time interval of the generated certificate.
     * @returns The certificate template.
     */
  static generateCertificateTemplate(attr, years) {
    let certificate = forge.pki.createCertificate();
    certificate.setSubject(attr);
    certificate.setIssuer(attr);
    certificate.validity.notBefore = new Date();
    certificate.validity.notAfter.setFullYear(
      certificate.validity.notBefore.getFullYear() + years);
    return certificate;
  }

  /**
     * Generate a CA certificate.
     * @param {forge.pki.PublicKey} publicKey The public Key of the CA.
     * @param {forge.pki.PrivateKey} privateKey The private Key of the CA.
     * @param {Object} certificateSubjects The object defining the content of CSR subjects.
     * @param {Number} years The valid time interval of the generated certificate. The default value is 1.
     * @returns A CA certificate.
     */
  static generateCACertificate(publicKey, privateKey, certificateSubjects, years=1) {
    let attrs = this.formattedSubjects(certificateSubjects);
    let caCertificate = this.generateCertificateTemplate(attrs, years);
    caCertificate.publicKey = publicKey;
    caCertificate.serialNumber = '01';
    caCertificate.setExtensions([{
      name: 'basicConstraints',
      cA: true,
    }, {
      name: 'subjectKeyIdentifier',
    }, {
      name: 'authorityKeyIdentifier',
      keyIdentifier: true,
    }]);
    caCertificate.sign(privateKey);
    return caCertificate;
  }

  /**
     * Generate the verification certificate.
     * @param {forge.pki.PrivateKey} caPrivateKey The CA private key to sign the verification certificate.
     * @param {forge.pki.Certificate} caCertificate The CA certificate to provide the CSR subjects.
     * @param {forge.pki.KeyPair} verificationKeys The key pair for verification.
     * @param {Number} years The valid time interval of the generated certificate. The default value is 1.
     * @returns A verification certificate.
     */
  static generateVerificationCertificate(caPrivateKey, caCertificate, verificationKeys, years=1) {
    let attrs = caCertificate.subject.attributes;
    let certificate = this.generateCertificateTemplate(attrs, years);
    certificate.publicKey = verificationKeys.publicKey;
    certificate.sign(caPrivateKey, forge.md.sha256.create());
    return certificate;
  }

  /**
     * Convert the property object into the desired format.
     * @param {Object} props The property object defining the content of CSR subjects.
     * @returns An array with formatted subjects.
     */
  static formattedSubjects(props) {
    return [{
      name: 'commonName',
      value: props.commonName || '',
    }, {
      name: 'countryName',
      value: props.countryName || '',
    }, {
      shortName: 'ST',
      value: props.stateName || '',
    }, {
      name: 'localityName',
      value: props.localityName || '',
    }, {
      name: 'organizationName',
      value: props.organizationName || '',
    }, {
      shortName: 'OU',
      value: props.organizationUnitName || '',
    }];
  }
};