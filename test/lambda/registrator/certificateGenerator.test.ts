import * as forge from 'node-forge';
import { CertificateGenerator as cg } from '../../../src/lambda-assets/caRegistrator/certificateGenerator';

test('test formattedSubjects', ()=>{
  const csrSubjects = {
    commonName: 'SoftChef',
    countryName: 'TW',
    stateName: 'TP',
    localityName: 'TW',
    organizationName: 'Soft Chef',
    organizationUnitName: 'web',
  };

  // Expected type and element amount
  var subjects = cg._formattedSubjects(csrSubjects);
  expect(typeof subjects).toBe(typeof []);
  expect(subjects.length).toBe(Object.keys(subjects).length);

  // Match the inputs
  var expectedElements = [
    { name: 'commonName', value: 'SoftChef' },
    { name: 'countryName', value: 'TW' },
    { shortName: 'ST', value: 'TP' },
    { name: 'localityName', value: 'TW' },
    { name: 'organizationName', value: 'Soft Chef' },
    { shortName: 'OU', value: 'web' },
  ];
  for (const subject of subjects) {
    expectedElements = expectedElements.filter((element) =>
      Object.assign(subject, element) != subject);
  }
  expect(expectedElements.length).toBe(0);

  // Match the default value
  var subjects = cg._formattedSubjects({});
  var expectedElements = [
    { name: 'commonName', value: '' },
    { name: 'countryName', value: '' },
    { shortName: 'ST', value: '' },
    { name: 'localityName', value: '' },
    { name: 'organizationName', value: '' },
    { shortName: 'OU', value: '' },
  ];
  for (const subject of subjects) {
    expectedElements = expectedElements.filter((element) =>
      Object.assign(subject, element) != subject);
  }
  expect(expectedElements.length).toBe(0);
});

test('test generateCertificateTemplate', ()=>{
  const csrSubjects = {
    commonName: 'SoftChef',
    countryName: 'TW',
    stateName: 'TP',
    localityName: 'TW',
    organizationName: 'Soft Chef',
    organizationUnitName: 'web',
  };
  const attr = cg._formattedSubjects(csrSubjects);

  // Match the subjects
  var cert = cg._generateCertificateTemplate(attr, 1);
  var expectedElements = [
    { name: 'commonName', value: 'SoftChef' },
    { name: 'countryName', value: 'TW' },
    { shortName: 'ST', value: 'TP' },
    { name: 'localityName', value: 'TW' },
    { name: 'organizationName', value: 'Soft Chef' },
    { shortName: 'OU', value: 'web' },
  ];
  for (const subject of cert.subject.attributes) {
    expectedElements = expectedElements.filter((element) =>
      Object.assign(subject, element) != subject);
  }
  expect(expectedElements.length).toBe(0);

  // Match the time interval
  expect(cert.validity.notAfter.getFullYear() - cert.validity.notBefore.getFullYear()).toBe(1);
  var cert = cg._generateCertificateTemplate(attr, 10);
  expect(cert.validity.notAfter.getFullYear() - cert.validity.notBefore.getFullYear()).toBe(10);
});

test('test generateCACertificate', ()=>{
  const csrSubjects = {
    commonName: 'SoftChef',
    countryName: 'TW',
    stateName: 'TP',
    localityName: 'TW',
    organizationName: 'Soft Chef',
    organizationUnitName: 'web',
  };

  // Match the certificate contents
  var keys = forge.pki.rsa.generateKeyPair(2048);
  var caCertificate = cg._generateCACertificate(keys.publicKey, keys.privateKey, csrSubjects);
  expect(caCertificate.publicKey).toBe(keys.publicKey);
  expect(caCertificate.verify(caCertificate)).toBe(true);
  expect(caCertificate.serialNumber).toBe('01');
  let expectedElements = [
    { name: 'basicConstraints', cA: true },
    { name: 'subjectKeyIdentifier' },
    { name: 'authorityKeyIdentifier', keyIdentifier: true },
  ];
  for (const extension of caCertificate.extensions) {
    expectedElements = expectedElements.filter((element) =>
      Object.assign(extension, element) != extension);
  }
  expect(expectedElements.length).toBe(0);
});

test('test generateVerificationCertificate', ()=>{
  const csrSubjects = {
    commonName: 'SoftChef',
    countryName: 'TW',
    stateName: 'TP',
    localityName: 'TW',
    organizationName: 'Soft Chef',
    organizationUnitName: 'web',
  };
  var caKeys = forge.pki.rsa.generateKeyPair(2048);
  var veriKeys = forge.pki.rsa.generateKeyPair(2048);
  var caCertificate = cg._generateCACertificate(caKeys.publicKey, caKeys.privateKey, csrSubjects);
  var vefiCert = cg._generateVerificationCertificate(caKeys.privateKey, caCertificate, veriKeys);
  // Match the public key
  expect(vefiCert.publicKey).toBe(veriKeys.publicKey);
  // Expect the verification certificate is signed by the CA certificate
  expect(caCertificate.verify(vefiCert)).toBe(true);
});

test('test getCaRegistrationCertificates', ()=>{
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
  expect(typeof certificates.ca.keys.privateKey).toBe(typeof '');
  expect(typeof certificates.ca.keys.publicKey).toBe(typeof '');
  expect(typeof certificates.ca.certificate).toBe(typeof '');
  expect(typeof certificates.verification.keys.privateKey).toBe(typeof '');
  expect(typeof certificates.verification.keys.publicKey).toBe(typeof '');
  expect(typeof certificates.verification.certificate).toBe(typeof '');

  // Verification certificate is signed with CA certificate
  var caCert = forge.pki.certificateFromPem(certificates.ca.certificate);
  var veriCert = forge.pki.certificateFromPem(certificates.verification.certificate);
  expect(caCert.verify(veriCert)).toBe(true);

  // CA keys are paired
  var privateKey = forge.pki.privateKeyFromPem(certificates.ca.keys.privateKey);
  var publicKey = forge.pki.publicKeyFromPem(certificates.ca.keys.publicKey);
  var md = forge.md.sha1.create();
  md.update('test', 'utf8');
  var signature = privateKey.sign(md);
  expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);
  expect(forge.pki.publicKeyToPem(caCert.publicKey)).toBe(certificates.ca.keys.publicKey);

  // Verification keys are paired
  var privateKey = forge.pki.privateKeyFromPem(certificates.verification.keys.privateKey);
  var publicKey = forge.pki.publicKeyFromPem(certificates.verification.keys.publicKey);
  var md = forge.md.sha1.create();
  md.update('test', 'utf8');
  var signature = privateKey.sign(md);
  expect(publicKey.verify(md.digest().getBytes(), signature)).toBe(true);

});