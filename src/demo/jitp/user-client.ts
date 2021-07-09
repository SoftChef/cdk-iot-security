import {
  CertificateGenerator,
} from '../../../lambda-assets/ca-registrator/certificate-generator';
import * as fs from 'fs';
import { pki } from 'node-forge';

function userClient() {
  console.log('User login...');
  console.log('Connected to device...');
}

function webService() {
  const file = fs.readFileSync('ca-certificate.json').toString();
  const certificateInfo = JSON.parse(file);
  const caCertificatePem = certificateInfo.ca.certificate;
  const caPrivateKeyPem = certificateInfo.ca.privatekey;
  const caCertificate = pki.certificateFromPem(caCertificatePem);
  const caPrivateKey = pki.privateKeyFromPem(caPrivateKeyPem);
  const deviceCertificates = CertificateGenerator.getDeviceRegistrationCertificates()
}

webService();