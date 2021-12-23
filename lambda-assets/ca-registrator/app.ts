import * as path from 'path';
import {
  IoTClient,
  GetRegistrationCodeCommand,
  RegisterCACertificateCommand,
  RegisterCACertificateCommandInput,
} from '@aws-sdk/client-iot';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import {
  Request,
  Response,
} from '@softchef/lambda-events';
import * as Joi from 'joi';
import { CertificateGenerator } from '../certificate-generator';
import {
  AwsError,
  VerifierError,
  InputError,
  ServerError,
} from '../errors';
import {
  csrSubjectsSchema,
  encryptionSchema,
} from '../schemas';
import defaultIotPolicy from './default-iot-policy.json';
import defaultTemplateBody from './default-template.json';

let onJITP: boolean;

/**
 * The lambda function handler for register CA.
 * @param event The HTTP request from the API gateway. It should be the following format:
 *
 * event = {
 *
 *  ...
 *
 *  "body": {
 *
 *    "csrSubjects": {
 *
 *      "commonName": "", // It would be replaced by the registration code, thus is unnecessary.
 *
 *      "countryName": "\<country name\>",
 *
 *      "stateName": "\<state name\>",
 *
 *      "localityName": "\<locality name\>",
 *
 *      "organizationName": "\<organization name\>",
 *
 *      "organizationUnitName": "\<organization unit name\>"
 *
 *    },
 *
 *    "verifierName": "\<verifier name\>",
 *
 *    "templateBody": "\<the stringified JSON object of the provision template\>",
 *
 *    "encryption": {
 *
 *      "algorithm": "\<the algorithm applied for the encryption of device certificate Generator\>",
 *
 *      "key": "\<the secret key for the encryption\>",
 *
 *      "iv": "\<the initial verctor for the encryption\>"
 *
 *    }
 *
 *  }
 *
 *  ...
 *
 * }
 *
 * @returns The HTTP response containing the registration result.
 */
export const handler = async (event: any = {}) : Promise <any> => {
  const request: Request = new Request(event);
  const response: Response = new Response();
  const bucketName: string = process.env.BUCKET_NAME!;
  const bucketPrefix: string = process.env.BUCKET_PREFIX!;
  const region: string | undefined = process.env.AWS_REGION;
  const registrationRoleArn: string | undefined = process.env.REGISTRATION_CONFIG_ROLE_ARN;
  defaultTemplateBody.Resources.policy.Properties.PolicyDocument = JSON.stringify(defaultIotPolicy);
  onJITP = registrationRoleArn ? true : false;

  const iotClient: IoTClient = new IoTClient({ region: region });

  try {
    const validated = request.validate(joi => {
      return {
        csrSubjects: csrSubjectsSchema,
        verifierName: joi.string().allow('', null),
        encryption: encryptionSchema.allow(null),
        templateBody: joi.string().allow(null),
      };
    });
    if (validated.error) {
      throw new InputError(JSON.stringify(validated.details));
    }

    let csrSubjects: CertificateGenerator.CsrSubjects = request.input('csrSubjects', {});
    const encryption: {[key: string]: string} = request.input('encryption', null);
    const inputVerifierName: string = request.input('verifierName', null);
    const inputTemplateBody: string = request.input('templateBody', null);

    const verifierName: string | undefined = specifyVerifier(inputVerifierName);

    const tags: any[] = addTags(verifierName, encryption);

    const registrationConfig: {[key:string]: any} = onJITP? {
      templateBody: inputTemplateBody ?? JSON.stringify(defaultTemplateBody),
      roleArn: registrationRoleArn,
    } : {};

    const certificates: CertificateGenerator.CaRegistrationRequiredCertificates = await createCertificates(csrSubjects);

    let registerCACertificateCommandInput: RegisterCACertificateCommandInput = {
      caCertificate: certificates.ca.certificate,
      verificationCertificate: certificates.verification.certificate,
      allowAutoRegistration: true,
      registrationConfig: registrationConfig,
      setAsActive: true,
      tags: tags,
    };

    const CaRegistration = await iotClient.send(
      new RegisterCACertificateCommand(registerCACertificateCommandInput),
    );

    const { certificateId, certificateArn } = await Joi.object({
      certificateId: Joi.string().required(),
      certificateArn: Joi.string().required(),
    }).unknown(true)
      .validateAsync(CaRegistration).catch((error: Error) => {
        throw new ServerError(error.message);
      });

    await uploadCaCertificates(bucketName, bucketPrefix, certificateId, certificateArn, certificates);

    return response.json({ certificateId: certificateId });
  } catch (error) {
    return response.error((error as AwsError).stack, (error as AwsError).code);
  }
};

/**
 * Sepcify the verifier name from the environment variable.
 * @param inputVerifierName The verifier name specified from the HTTP request.
 * @returns The verifier name.
 */
function specifyVerifier(inputVerifierName: string) {
  const verifiers: {[key: string]: string} = [...JSON.parse(process.env.VERIFIERS!)]
    .reduce((accumulator: {[key:string]: string}, current: string) => (accumulator[current]=current, accumulator), {});

  let verifierName: string | undefined = undefined;

  if (inputVerifierName && !(verifierName = verifiers[inputVerifierName])) {
    throw new VerifierError();
  }

  return verifierName;
}

/**
 * Construct the tag array for the CA certificate.
 * @param verifierName The verifier name.
 * @param encryption The encryption information.
 * @returns An array of CA certificate tags.
 */
function addTags(verifierName: string | undefined, encryption: {[key: string]: string}) {
  let createTag = (Key: string, Value: string) => {
    return { Key, Value };
  };

  let tags: any[] = [];

  if (verifierName) {
    tags.push(createTag('verifierName', verifierName));
  }

  if (onJITP && encryption) {
    tags.push(createTag('encryption', JSON.stringify(encryption)));
  }

  return tags;
}

/**
 * Generate the certificates for registering a CA on AWS IoT.
 * @param csrSubjects The CSR Subjects adding to the CA certificate information fields.
 * @returns A set of certificates including CA certificates and verification certificates.
 */
async function createCertificates(csrSubjects: CertificateGenerator.CsrSubjects) {
  const { registrationCode } = await new IoTClient({}).send(
    new GetRegistrationCodeCommand({}),
  );
  csrSubjects = Object.assign(csrSubjects, { commonName: registrationCode });

  const certificates: CertificateGenerator.CaRegistrationRequiredCertificates = CertificateGenerator.getCaRegistrationCertificates(csrSubjects);

  return certificates;
}

/**
 * Upload the certificate set to the sepcefied S3 bucket.
 * @param bucketName The S3 bucket name.
 * @param bucketPrefix The path prefix to upload the files.
 * @param certificateId The CA certificate Id.
 * @param certificateArn The CA certificate Arn.
 * @param certificates The Certificate Set.
 */
async function uploadCaCertificates(
  bucketName: string, bucketPrefix: string,
  certificateId: string, certificateArn: string,
  certificates: CertificateGenerator.CaRegistrationRequiredCertificates,
) {
  const s3Client = new S3Client({});

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, certificateId!, 'ca.public_key.pem'),
      Body: Buffer.from(certificates.ca.publicKey),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, certificateId!, 'ca.private_key.pem'),
      Body: Buffer.from(certificates.ca.privateKey),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, certificateId!, 'ca.cert.pem'),
      Body: Buffer.from(certificates.ca.certificate),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, certificateId!, 'verification.public_key.pem'),
      Body: Buffer.from(certificates.verification.publicKey),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, certificateId!, 'verification.private_key.pem'),
      Body: Buffer.from(certificates.verification.privateKey),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, certificateId!, 'verification.cert.pem'),
      Body: Buffer.from(certificates.verification.certificate),
    }),
  );

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: path.join(bucketPrefix, certificateId!, 'ca-certificate.json'),
      Body: Buffer.from(
        JSON.stringify({
          certificateId,
          certificateArn,
        }),
      ),
    }),
  );
}