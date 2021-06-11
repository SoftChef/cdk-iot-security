import * as forge from 'node-forge';
import { Certificates } from '../../../src/lambda-assets/registrator/certificates';

test('test getCaRegistrationCertificates', ()=>{
  const csrSubjects = {
    commonName: 'SoftChef',
    countryName: 'TW',
    stateName: 'TP',
    localityName: 'TW',
    organizationName: 'Soft Chef',
    organizationUnitName: 'web',
  };
  var certificates = Certificates.getCaRegistrationCertificates(csrSubjects);

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