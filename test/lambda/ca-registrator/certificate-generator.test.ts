import * as forge from 'node-forge';
import { CertificateGenerator as cg } from '../../../lambda-assets/ca-registrator/certificate-generator';

test('Call getCaRegistrationCertificates', ()=>{
  const csrSubjects = {
    commonName: 'SoftChef',
    countryName: 'TW',
    stateName: 'TP',
    localityName: 'TW',
    organizationName: 'Soft Chef',
    organizationUnitName: 'web',
  };
  var certificates = cg.getCaRegistrationCertificates(csrSubjects);

  // Certificates information are defined
  expect(typeof certificates.ca.privateKey).toBe(typeof '');
  expect(typeof certificates.ca.publicKey).toBe(typeof '');
  expect(typeof certificates.ca.certificate).toBe(typeof '');
  expect(typeof certificates.verification.privateKey).toBe(typeof '');
  expect(typeof certificates.verification.publicKey).toBe(typeof '');
  expect(typeof certificates.verification.certificate).toBe(typeof '');

  // Verification certificate is signed with CA certificate
  var caCert = forge.pki.certificateFromPem(certificates.ca.certificate);
  var veriCert = forge.pki.certificateFromPem(certificates.verification.certificate);
  expect(caCert.verify(veriCert)).toBe(true);

  // CA keys are paired
  var privateKey = forge.pki.privateKeyFromPem(certificates.ca.privateKey);
  var publicKey = forge.pki.publicKeyFromPem(certificates.ca.publicKey);
  var md = forge.md.sha1.create();
  md.update('test', 'utf8');
  var signature = privateKey.sign(md);
  expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
  expect(forge.pki.publicKeyToPem(caCert.publicKey)).toBe(certificates.ca.publicKey);

  // Verification keys are paired
  var privateKey = forge.pki.privateKeyFromPem(certificates.verification.privateKey);
  var publicKey = forge.pki.publicKeyFromPem(certificates.verification.publicKey);
  var md = forge.md.sha1.create();
  md.update('test', 'utf8');
  var signature = privateKey.sign(md);
  expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
});

test('Call getCaRegistrationCertificates without CSR subjects', ()=>{
  var certificates = cg.getCaRegistrationCertificates();

  // Certificates information are defined
  expect(typeof certificates.ca.privateKey).toBe(typeof '');
  expect(typeof certificates.ca.publicKey).toBe(typeof '');
  expect(typeof certificates.ca.certificate).toBe(typeof '');
  expect(typeof certificates.verification.privateKey).toBe(typeof '');
  expect(typeof certificates.verification.publicKey).toBe(typeof '');
  expect(typeof certificates.verification.certificate).toBe(typeof '');

  // Verification certificate is signed with CA certificate
  var caCert = forge.pki.certificateFromPem(certificates.ca.certificate);
  var veriCert = forge.pki.certificateFromPem(certificates.verification.certificate);
  expect(caCert.verify(veriCert)).toBe(true);

  // CA keys are paired
  var privateKey = forge.pki.privateKeyFromPem(certificates.ca.privateKey);
  var publicKey = forge.pki.publicKeyFromPem(certificates.ca.publicKey);
  var md = forge.md.sha1.create();
  md.update('test', 'utf8');
  var signature = privateKey.sign(md);
  expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
  expect(forge.pki.publicKeyToPem(caCert.publicKey)).toBe(certificates.ca.publicKey);

  // Verification keys are paired
  var privateKey = forge.pki.privateKeyFromPem(certificates.verification.privateKey);
  var publicKey = forge.pki.publicKeyFromPem(certificates.verification.publicKey);
  var md = forge.md.sha1.create();
  md.update('test', 'utf8');
  var signature = privateKey.sign(md);
  expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
});