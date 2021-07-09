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
describe('Call function getCaRegistrationCertificates', () => {
  let caCertificates: cg.CaRegistrationRequiredCertificates;
  beforeEach(() => {
    caCertificates = cg.getCaRegistrationCertificates(csrSubjects);
  });

  test('Certificates information are defined', () => {
    expect(typeof caCertificates.ca.privateKey).toBe(typeof '');
    expect(typeof caCertificates.ca.publicKey).toBe(typeof '');
    expect(typeof caCertificates.ca.certificate).toBe(typeof '');
    expect(typeof caCertificates.verification.privateKey).toBe(typeof '');
    expect(typeof caCertificates.verification.publicKey).toBe(typeof '');
    expect(typeof caCertificates.verification.certificate).toBe(typeof '');
  });

  test('Verification certificate is signed with CA certificate', () => {
    var caCert = forge.pki.certificateFromPem(caCertificates.ca.certificate);
    var veriCert = forge.pki.certificateFromPem(caCertificates.verification.certificate);
    expect(caCert.verify(veriCert)).toBe(true);
  });

  test('CA keys are paired', () => {
    var caCert = forge.pki.certificateFromPem(caCertificates.ca.certificate);
    var privateKey = forge.pki.privateKeyFromPem(caCertificates.ca.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(caCertificates.ca.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
    expect(forge.pki.publicKeyToPem(caCert.publicKey)).toBe(caCertificates.ca.publicKey);
  });

  test('Verification keys are paired', () => {
    var privateKey = forge.pki.privateKeyFromPem(caCertificates.verification.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(caCertificates.verification.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
  });
});

describe('Call function getCaRegistrationCertificates without CSR subjects', () => {

  let caCertificates: cg.CaRegistrationRequiredCertificates;

  beforeEach(() => {
    caCertificates = cg.getCaRegistrationCertificates();
  });

  test('Certificates information are defined', () => {
    expect(typeof caCertificates.ca.privateKey).toBe(typeof '');
    expect(typeof caCertificates.ca.publicKey).toBe(typeof '');
    expect(typeof caCertificates.ca.certificate).toBe(typeof '');
    expect(typeof caCertificates.verification.privateKey).toBe(typeof '');
    expect(typeof caCertificates.verification.publicKey).toBe(typeof '');
    expect(typeof caCertificates.verification.certificate).toBe(typeof '');
  });

  test('Verification certificate is signed with CA certificate', () => {
    var caCert = forge.pki.certificateFromPem(caCertificates.ca.certificate);
    var veriCert = forge.pki.certificateFromPem(caCertificates.verification.certificate);
    expect(caCert.verify(veriCert)).toBe(true);
  });

  test('CA keys are paired', () => {
    var caCert = forge.pki.certificateFromPem(caCertificates.ca.certificate);
    var privateKey = forge.pki.privateKeyFromPem(caCertificates.ca.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(caCertificates.ca.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
    expect(forge.pki.publicKeyToPem(caCert.publicKey)).toBe(caCertificates.ca.publicKey);
  });

  test('Verification keys are paired', () => {
    var privateKey = forge.pki.privateKeyFromPem(caCertificates.verification.privateKey);
    var publicKey = forge.pki.publicKeyFromPem(caCertificates.verification.publicKey);
    var md = forge.md.sha1.create();
    md.update('test', 'utf8');
    var signature = privateKey.sign(md);
    expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
  });
});

describe('Call function getDeviceRegistrationCertificates', () => {
  let caCertificates: cg.CaRegistrationRequiredCertificates;
  let deviceCertificates: cg.CertificateSet;

  beforeEach(() => {
    caCertificates = cg.getCaRegistrationCertificates(csrSubjects);
    deviceCertificates = cg.getDeviceRegistrationCertificates(caCertificates.ca);
  });

  test('Device certificate is signed with CA certificate', () => {
    var caCert = forge.pki.certificateFromPem(caCertificates.ca.certificate);
    var deviceCert = forge.pki.certificateFromPem(deviceCertificates.certificate);
    expect(caCert.verify(deviceCert)).toBe(true);
  });
});