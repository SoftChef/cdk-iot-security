import { pki, md } from 'node-forge';

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
    const caKeys: pki.KeyPair = pki.rsa.generateKeyPair(2048);
    const caCertificate: pki.Certificate = this.generateCACertificate(
      caKeys.publicKey,
      caKeys.privateKey,
      csrSubjects,
    );
    const verificationKeys: pki.KeyPair = pki.rsa.generateKeyPair(2048);
    const verificationCertificate: pki.Certificate = this.generateCaSignedCertificate(
      caKeys.privateKey,
      caCertificate,
      verificationKeys,
    );
    const certificates: CertificateGenerator.CaRegistrationRequiredCertificates = {
      ca: {
        publicKey: pki.publicKeyToPem(caKeys.publicKey),
        privateKey: pki.privateKeyToPem(caKeys.privateKey),
        certificate: pki.certificateToPem(caCertificate),
      },
      verification: {
        publicKey: pki.publicKeyToPem(verificationKeys.publicKey),
        privateKey: pki.privateKeyToPem(verificationKeys.privateKey),
        certificate: pki.certificateToPem(verificationCertificate),
      },
    };
    return certificates;
  }

  /**
   * Generate the device certificate which is signed by the specified CA.
   * @param caCertificates The CA certificate about to sign this device detificate.
   * @param commonName The data for the common name field of this device certificate.
   * @returns The device certificate set, including the public key, private key, and the CA-signed certificate.
   */
  public static getDeviceRegistrationCertificates(
    caCertificates: CertificateGenerator.CertificateSet,
    csrSubjects: CertificateGenerator.CsrSubjects = {},
    years = 1,
  ) {
    const caKeys: pki.KeyPair = {
      publicKey: pki.publicKeyFromPem(caCertificates.publicKey),
      privateKey: pki.privateKeyFromPem(caCertificates.privateKey),
    };
    const caCertificate: pki.Certificate = pki.certificateFromPem(caCertificates.certificate);
    const deviceKeys: pki.KeyPair = pki.rsa.generateKeyPair(2048);
    const deviceCertificate: pki.Certificate = this.generateCaSignedCertificate(
      caKeys.privateKey,
      caCertificate,
      deviceKeys,
      this.formattedSubjects(csrSubjects),
      years,
    );
    const deviceCertificateSet: CertificateGenerator.CertificateSet = {
      publicKey: pki.publicKeyToPem(deviceKeys.publicKey),
      privateKey: pki.privateKeyToPem(deviceKeys.privateKey),
      certificate: pki.certificateToPem(deviceCertificate),
    };
    return deviceCertificateSet;
  }

  /**
     * Generate a certificate template which can be further
     * used to generate a CA or a verification certificate.
     * @param caAttrs The formatted CSR subject.
     * @param attrs The subjects of the certificate.
     * @param years The valid time interval of the generated certificate.
     * @returns The certificate template.
     */
  private static generateCertificateTemplate(caAttrs: pki.CertificateField[], attrs: pki.CertificateField[], years: number): pki.Certificate {
    let certificate: pki.Certificate = pki.createCertificate();
    certificate.setIssuer(caAttrs);
    certificate.setSubject(attrs);
    certificate.validity.notBefore = new Date();
    certificate.validity.notAfter.setFullYear(certificate.validity.notBefore.getFullYear() + years);
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
    let caCertificate: pki.Certificate = this.generateCertificateTemplate(attrs, attrs, years);
    caCertificate.publicKey = publicKey;
    caCertificate.serialNumber = '01';
    caCertificate.setExtensions([
      {
        name: 'basicConstraints',
        cA: true,
      },
      {
        name: 'subjectKeyIdentifier',
      },
      {
        name: 'authorityKeyIdentifier',
        keyIdentifier: true,
      },
    ]);
    caCertificate.sign(privateKey);
    return caCertificate;
  }

  /**
     * Generate the CA-signed certificate.
     * @param caPrivateKey The CA private key to sign the verification certificate.
     * @param caCertificate The CA certificate to provide the issuer subjects.
     * @param keyPair The key pair for verification.
     * @param attrs The subjects of the certificate. If it is not povided, the subjects would be filled with the subjects of the CA certificate.
     * @param years The valid time interval of the generated certificate. The default value is 1.
     * @returns A verification certificate.
     */
  private static generateCaSignedCertificate(
    caPrivateKey: pki.PrivateKey,
    caCertificate: pki.Certificate,
    keyPair: pki.KeyPair,
    attrs?: pki.CertificateField[],
    years: number = 1,
  ) {
    let caAttrs = caCertificate.subject.attributes;
    let csr = this.generateCsr(keyPair, attrs ?? caAttrs);
    let certificate: pki.Certificate = this.generateCertificateTemplate(caAttrs, csr.subject.attributes, years);
    certificate.publicKey = csr.publicKey;
    certificate.sign(caPrivateKey, md.sha256.create());
    return certificate;
  }

  /**
   * Generate a CSR
   * @param keyPair The key pair to generate this CSR.
   * @param attrs The subjects of this CSR. If it is not provided, all fields would keep plain.
   * @returns A CSR.
   */
  private static generateCsr(keyPair: pki.KeyPair, attrs: pki.CertificateField[]) {
    let csr = pki.createCertificationRequest();
    csr.publicKey = keyPair.publicKey;
    csr.setSubject(attrs);
    csr.sign(keyPair.privateKey, md.sha256.create());
    return csr;
  }

  /**
     * Convert the property object into the desired format.
     * @param props The property object defining the content of CSR subjects.
     * @returns An array with formatted subjects.
     */
  private static formattedSubjects(props: CertificateGenerator.CsrSubjects): pki.CertificateField[] {
    return [
      {
        name: 'commonName',
        value: props.commonName || '',
      },
      {
        name: 'countryName',
        value: props.countryName || '',
      },
      {
        shortName: 'ST',
        value: props.stateName || '',
      },
      {
        name: 'localityName',
        value: props.localityName || '',
      },
      {
        name: 'organizationName',
        value: props.organizationName || '',
      },
      {
        shortName: 'OU',
        value: props.organizationUnitName || '',
      },
    ];
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