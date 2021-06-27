import * as forge from 'node-forge';
import { CertificateGenerator as cg } from '../../../lambda-assets/ca-registrator/certificate-generator';

const csrSubjects = {
  commonName: 'SoftChef',
  countryName: 'TW',
  stateName: 'TP',
  localityName: 'TW',
  organizationName: 'Soft Chef',
  organizationUnitName: 'web',
};
describe("Call function getCaRegistrationCertificates", () => {
  test("Certificates information are defined", () => {
    var certificates = cg.getCaRegistrationCertificates(csrSubjects);
    expect(typeof certificates.ca.privateKey).toBe(typeof '');
    expect(typeof certificates.ca.publicKey).toBe(typeof '');
    expect(typeof certificates.ca.certificate).toBe(typeof '');
    expect(typeof certificates.verification.privateKey).toBe(typeof '');
    expect(typeof certificates.verification.publicKey).toBe(typeof '');
    expect(typeof certificates.verification.certificate).toBe(typeof '');  
  });

  test("Verification certificate is signed with CA certificate", () => {
    var certificates = cg.getCaRegistrationCertificates(csrSubjects);
    var caCert = forge.pki.certificateFromPem(certificates.ca.certificate);
    var veriCert = forge.pki.certificateFromPem(certificates.verification.certificate);
    expect(caCert.verify(veriCert)).toBe(true);
  });

  test("CA keys are paired", () => {
    var certificates = cg.getCaRegistrationCertificates(csrSubjects);
    var caCert = forge.pki.certificateFromPem(certificates.ca.certificate);
    var privateKey = forge.pki.privateKeyFromPem(certificates.ca.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(certificates.ca.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
    expect(forge.pki.publicKeyToPem(caCert.publicKey)).toBe(certificates.ca.publicKey);
  });

  test("Verification keys are paired", () => {
    var certificates = cg.getCaRegistrationCertificates(csrSubjects);
    var privateKey = forge.pki.privateKeyFromPem(certificates.verification.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(certificates.verification.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
  });
})

describe("Call function getCaRegistrationCertificates without CSR subjects", () => {
  test("Certificates information are defined", () => {
    var certificates = cg.getCaRegistrationCertificates();
    expect(typeof certificates.ca.privateKey).toBe(typeof '');
    expect(typeof certificates.ca.publicKey).toBe(typeof '');
    expect(typeof certificates.ca.certificate).toBe(typeof '');
    expect(typeof certificates.verification.privateKey).toBe(typeof '');
    expect(typeof certificates.verification.publicKey).toBe(typeof '');
    expect(typeof certificates.verification.certificate).toBe(typeof '');
  });
  test("Verification certificate is signed with CA certificate", () => {
    var certificates = cg.getCaRegistrationCertificates();
    var caCert = forge.pki.certificateFromPem(certificates.ca.certificate);
    var veriCert = forge.pki.certificateFromPem(certificates.verification.certificate);
    expect(caCert.verify(veriCert)).toBe(true);
  });
  test("CA keys are paired", () => {
    var certificates = cg.getCaRegistrationCertificates();
    var caCert = forge.pki.certificateFromPem(certificates.ca.certificate);
    var privateKey = forge.pki.privateKeyFromPem(certificates.ca.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(certificates.ca.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
    expect(forge.pki.publicKeyToPem(caCert.publicKey)).toBe(certificates.ca.publicKey);
  });
  test("Verification keys are paired", () => {
    var certificates = cg.getCaRegistrationCertificates();
    var privateKey = forge.pki.privateKeyFromPem(certificates.verification.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(certificates.verification.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
  });
});