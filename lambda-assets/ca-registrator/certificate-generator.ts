import * as forge from 'node-forge';
import { pki } from 'node-forge';

export class CertificateGenerator {

  /**
     * Get the cetificates for registering a CA.
     * The returned object contains the public key of the CA,
     * the private key of the CA,
     * the certificate of the CA,
     * the public key of the verification,
     * the private key of the verification,
     * and the certificate of the verification.
     * @param csrSubjects The object defining the content of CSR subjects.
     * @returns
     */
  public static getCaRegistrationCertificates(csrSubjects: CertificateGenerator.CsrSubjects = {}) {
    const caKeys: pki.KeyPair = forge.pki.rsa.generateKeyPair(2048);
    const caCertificate: pki.Certificate = this.generateCACertificate(
      caKeys.publicKey, caKeys.privateKey, csrSubjects);
    const verificationKeys: pki.KeyPair = forge.pki.rsa.generateKeyPair(2048);
    const verificationCertificate: pki.Certificate = this.generateVerificationCertificate(
      caKeys.privateKey, caCertificate, verificationKeys);
    const certificates: CertificateGenerator.CaRegistrationRequiredCertificates = {
      ca: {
        publicKey: forge.pki.publicKeyToPem(caKeys.publicKey),
        privateKey: forge.pki.privateKeyToPem(caKeys.privateKey),
        certificate: forge.pki.certificateToPem(caCertificate),
      },
      verification: {
        publicKey: forge.pki.publicKeyToPem(verificationKeys.publicKey),
        privateKey: forge.pki.privateKeyToPem(verificationKeys.privateKey),
        certificate: forge.pki.certificateToPem(verificationCertificate),
      },
    };
    return certificates;
  }
  /**
     * Generate a certificate template which can be further
     * used to generate a CA or a verification certificate.
     * @param attr The formatted CSR subject.
     * @param years The valid time interval of the generated certificate.
     * @returns The certificate template.
     */
  private static generateCertificateTemplate(attr: pki.CertificateField[], years: number): pki.Certificate {
    let certificate: pki.Certificate = forge.pki.createCertificate();
    certificate.setSubject(attr);
    certificate.setIssuer(attr);
    certificate.validity.notBefore = new Date();
    certificate.validity.notAfter.setFullYear(
      certificate.validity.notBefore.getFullYear() + years);
    return certificate;
  }

  /**
     * Generate a CA certificate.
     * @param publicKey The public Key of the CA.
     * @param privateKey The private Key of the CA.
     * @param certificateSubjects The object defining the content of CSR subjects.
     * @param years The valid time interval of the generated certificate. The default value is 1.
     * @returns A CA certificate.
     */
  private static generateCACertificate(
    publicKey: pki.PublicKey,
    privateKey: pki.PrivateKey,
    certificateSubjects: CertificateGenerator.CsrSubjects,
    years: number = 1,
  ) {
    let attrs: pki.CertificateField[] = this.formattedSubjects(certificateSubjects);
    let caCertificate: pki.Certificate = this.generateCertificateTemplate(attrs, years);
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
     * @param caPrivateKey The CA private key to sign the verification certificate.
     * @param caCertificate The CA certificate to provide the CSR subjects.
     * @param verificationKeys The key pair for verification.
     * @param years The valid time interval of the generated certificate. The default value is 1.
     * @returns A verification certificate.
     */
  private static generateVerificationCertificate(
    caPrivateKey: pki.PrivateKey,
    caCertificate: pki.Certificate,
    verificationKeys: pki.KeyPair,
    years: number = 1,
  ) {
    let attrs: pki.CertificateField[] = caCertificate.subject.attributes;
    let certificate: pki.Certificate = this.generateCertificateTemplate(attrs, years);
    certificate.publicKey = verificationKeys.publicKey;
    certificate.sign(caPrivateKey, forge.md.sha256.create());
    return certificate;
  }

  /**
     * Convert the property object into the desired format.
     * @param props The property object defining the content of CSR subjects.
     * @returns An array with formatted subjects.
     */
  private static formattedSubjects(props: CertificateGenerator.CsrSubjects): pki.CertificateField[] {
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
}

export namespace CertificateGenerator {
  export interface CsrSubjects {
    commonName?: string;
    countryName?: string;
    stateName?: string;
    localityName?: string;
    organizationName?: string;
    organizationUnitName?: string;
  }

  export interface CaRegistrationRequiredCertificates {
    ca: CertificateSet;
    verification: CertificateSet;
  }

  export interface CertificateSet {
    publicKey: string;
    privateKey: string;
    certificate: string;
  }
}