//const { KeyGenerator: kg } = require('../util');
import * as forge from 'node-forge';
import { KeyGenerator as kg } from '../util';

test('test formattedSubjects', ()=>{
  const csrSubjects = {
    commonName: 'SoftChef',
    countryName: 'TW',
    stateName: 'TP',
    localityName: 'TW',
    organizationName: 'Soft Chef',
    organizationUnitName: 'web',
  };
  var subjects = kg.formattedSubjects(csrSubjects);
  expect(typeof subjects).toBe(typeof []);
  expect(subjects.length).toBe(Object.keys(subjects).length);

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

  var subjects = kg.formattedSubjects({});
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
  var cert = kg.generateCertificateTemplate(csrSubjects);
  expect(cert.subject.attributes).toBe(csrSubjects);
  expect(cert.validity.notAfter.getFullYear() - cert.validity.notBefore.getFullYear()).toBe(1);
  var cert = kg.generateCertificateTemplate(csrSubjects, 10);
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
  var keys = forge.pki.rsa.generateKeyPair(2048);
  var caCertificate = kg.generateCACertificate(keys.publicKey, keys.privateKey, csrSubjects);
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
  var caCertificate = kg.generateCACertificate(caKeys.publicKey, caKeys.privateKey, csrSubjects);
  var vefiCert = kg.generateVerificationCertificate(caKeys.privateKey, caCertificate, veriKeys);
  expect(vefiCert.publicKey).toBe(veriKeys.publicKey);
  expect(caCertificate.verify(vefiCert)).toBe(true);
});