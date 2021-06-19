import * as forge from 'node-forge';
import { CertificateGenerator as cg } from '../../../../lambda-assets/ca-registrator/certificate-generator';

// test('test formattedSubjects', ()=>{
//   const csrSubjects = {
//     commonName: 'SoftChef',
//     countryName: 'TW',
//     stateName: 'TP',
//     localityName: 'TW',
//     organizationName: 'Soft Chef',
//     organizationUnitName: 'web',
//   };

//   // Expected type and element amount
//   var subjects = cg.formattedSubjects(csrSubjects);
//   expect(typeof subjects).toBe(typeof []);
//   expect(subjects.length).toBe(Object.keys(subjects).length);

//   // Match the inputs
//   var expectedElements = [
//     { name: 'commonName', value: 'SoftChef' },
//     { name: 'countryName', value: 'TW' },
//     { shortName: 'ST', value: 'TP' },
//     { name: 'localityName', value: 'TW' },
//     { name: 'organizationName', value: 'Soft Chef' },
//     { shortName: 'OU', value: 'web' },
//   ];
//   for (const subject of subjects) {
//     expectedElements = expectedElements.filter((element) =>
//       Object.assign(subject, element) != subject);
//   }
//   expect(expectedElements.length).toBe(0);

//   // Match the default value
//   var subjects = cg.formattedSubjects({});
//   var expectedElements = [
//     { name: 'commonName', value: '' },
//     { name: 'countryName', value: '' },
//     { shortName: 'ST', value: '' },
//     { name: 'localityName', value: '' },
//     { name: 'organizationName', value: '' },
//     { shortName: 'OU', value: '' },
//   ];
//   for (const subject of subjects) {
//     expectedElements = expectedElements.filter((element) =>
//       Object.assign(subject, element) != subject);
//   }
//   expect(expectedElements.length).toBe(0);
// });

// test('test generateCertificateTemplate', ()=>{
//   const csrSubjects = {
//     commonName: 'SoftChef',
//     countryName: 'TW',
//     stateName: 'TP',
//     localityName: 'TW',
//     organizationName: 'Soft Chef',
//     organizationUnitName: 'web',
//   };
//   const attr = cg.formattedSubjects(csrSubjects);

//   // Match the subjects
//   var cert = cg.generateCertificateTemplate(attr, 1);
//   var expectedElements = [
//     { name: 'commonName', value: 'SoftChef' },
//     { name: 'countryName', value: 'TW' },
//     { shortName: 'ST', value: 'TP' },
//     { name: 'localityName', value: 'TW' },
//     { name: 'organizationName', value: 'Soft Chef' },
//     { shortName: 'OU', value: 'web' },
//   ];
//   for (const subject of cert.subject.attributes) {
//     expectedElements = expectedElements.filter((element) =>
//       Object.assign(subject, element) != subject);
//   }
//   expect(expectedElements.length).toBe(0);

//   // Match the time interval
//   expect(cert.validity.notAfter.getFullYear() - cert.validity.notBefore.getFullYear()).toBe(1);
//   var cert = cg.generateCertificateTemplate(attr, 10);
//   expect(cert.validity.notAfter.getFullYear() - cert.validity.notBefore.getFullYear()).toBe(10);
// });

// test('test generateCACertificate', ()=>{
//   const csrSubjects = {
//     commonName: 'SoftChef',
//     countryName: 'TW',
//     stateName: 'TP',
//     localityName: 'TW',
//     organizationName: 'Soft Chef',
//     organizationUnitName: 'web',
//   };

//   // Match the certificate contents
//   var keys = forge.pki.rsa.generateKeyPair(2048);
//   var caCertificate = cg.generateCACertificate(keys.publicKey, keys.privateKey, csrSubjects);
//   expect(caCertificate.publicKey).toBe(keys.publicKey);
//   expect(caCertificate.verify(caCertificate)).toBe(true);
//   expect(caCertificate.serialNumber).toBe('01');
//   let expectedElements = [
//     { name: 'basicConstraints', cA: true },
//     { name: 'subjectKeyIdentifier' },
//     { name: 'authorityKeyIdentifier', keyIdentifier: true },
//   ];
//   for (const extension of caCertificate.extensions) {
//     expectedElements = expectedElements.filter((element) =>
//       Object.assign(extension, element) != extension);
//   }
//   expect(expectedElements.length).toBe(0);
// });

// test('test generateVerificationCertificate', ()=>{
//   const csrSubjects = {
//     commonName: 'SoftChef',
//     countryName: 'TW',
//     stateName: 'TP',
//     localityName: 'TW',
//     organizationName: 'Soft Chef',
//     organizationUnitName: 'web',
//   };
//   var caKeys = forge.pki.rsa.generateKeyPair(2048);
//   var veriKeys = forge.pki.rsa.generateKeyPair(2048);
//   var caCertificate = cg.generateCACertificate(caKeys.publicKey, caKeys.privateKey, csrSubjects);
//   var vefiCert = cg.generateVerificationCertificate(caKeys.privateKey, caCertificate, veriKeys);
//   // Match the public key
//   expect(vefiCert.publicKey).toBe(veriKeys.publicKey);
//   // Expect the verification certificate is signed by the CA certificate
//   expect(caCertificate.verify(vefiCert)).toBe(true);
// });

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