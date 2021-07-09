import * as fs from 'fs';
import * as mqtt from 'mqtt';
import { pki, md } from 'node-forge';

const amazonRootCA1 = `-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE-----`;

function userClient() {
  console.log('User login...');
  console.log('Connect to the device...');
  console.log('Connect to the web service...');
  const deviceCertificates = webService();
  console.log('Pass the device certificate to the device.');
  fs.writeFileSync(`${__dirname}/device-certificate.json`, JSON.stringify(deviceCertificates));
}

function webService() {
  function getDeviceRegistrationCertificates(caCertificates: {[key:string]: string}) {
    const caKeys: pki.KeyPair = {
      publicKey: pki.publicKeyFromPem(caCertificates.publicKey),
      privateKey: pki.privateKeyFromPem(caCertificates.privateKey),
    };
    const caCertificate: pki.Certificate = pki.certificateFromPem(caCertificates.certificate);
    const deviceKeys: pki.KeyPair = pki.rsa.generateKeyPair(2048);
    let attrs: pki.CertificateField[] = caCertificate.subject.attributes;
    let deviceCertificate: pki.Certificate = pki.createCertificate();
    deviceCertificate.setSubject(attrs);
    deviceCertificate.setIssuer(attrs);
    deviceCertificate.validity.notBefore = new Date();
    deviceCertificate.validity.notAfter.setFullYear(deviceCertificate.validity.notBefore.getFullYear() + 1);
    deviceCertificate.publicKey = deviceKeys.publicKey;
    deviceCertificate.sign(caKeys.privateKey, md.sha256.create());
    const certificateSet = {
      publicKey: pki.publicKeyToPem(deviceKeys.publicKey),
      privateKey: pki.privateKeyToPem(deviceKeys.privateKey),
      certificate: pki.certificateToPem(deviceCertificate),
    };
    return certificateSet;
  }
  const file = fs.readFileSync(`${__dirname}/ca-certificate.json`).toString();
  const certificateInfo = JSON.parse(file);
  const caCertificatePem = certificateInfo.ca.certificate;
  const deviceCertificates = getDeviceRegistrationCertificates(certificateInfo.ca);
  deviceCertificates.certificate += caCertificatePem;
  return deviceCertificates;
}

function device() {
  const file = fs.readFileSync(`${__dirname}/device-certificate.json`).toString();
  const deviceCertificates = JSON.parse(file);
  const options = {
    port: 8883,
    host: 'a1r289pzzumq0y-ats.iot.us-east-1.amazonaws.com',
    key: deviceCertificates.privateKey,
    cert: deviceCertificates.certificate,
    rejectUnauthorized: false,
    ca: amazonRootCA1,
    protocol: 'mqtts',
    clientId: 'client',
  };
  console.log('Connect to the AWS IoT');
  const client = mqtt.connect(options);
  const topic = 'message';
  client.publish(topic, 'hello', {
    qos: 1,
  });
  client.end();
}

/**
 * User client connect to the web service which generates
 * a new CA-signed certificate.
 * Then, the client pass the certificate to the device.
 */
userClient();
/**
 * The device use the certificate passed in to connect to
 * the AWS IoT.
 */
device();