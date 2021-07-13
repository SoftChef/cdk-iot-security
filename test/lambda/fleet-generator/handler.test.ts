import {
  IoTClient,
  CreateProvisioningTemplateCommand,
  CreatePolicyCommand,
  CreateKeysAndCertificateCommand,
  AttachPolicyCommand,
} from '@aws-sdk/client-iot';
import {
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from '../../../lambda-assets/fleet-generator/app';

beforeEach(() => {

});

describe('Sucessfully execute the handler', () => {

});