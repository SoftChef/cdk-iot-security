import { Bucket } from '@aws-cdk/aws-s3';
import { DeviceActivator } from './device-activator';
import { VerifierRecorder } from './verifier-recorder';

export module CaRegistrationFunction {
  export interface CaRegistrationFunctionProps {
    /**
     * The AWS SQS Queue collecting the MQTT messages sending
     * from the CA-associated Iot Rule, which sends a message
     * every time a client register its certificate.
     */
    readonly deviceActivatorQueue: DeviceActivator.Queue;
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    /**
     * The verifiers to verify the client certificates.
     */
    readonly verifiers?: [VerifierRecorder.VerifierProps];
  }

  export interface VaultProps {
    /**
     * The S3 bucket
     */
    readonly bucket: Bucket;
    /**
     * The specified prefix to save the file.
     */
    readonly prefix: string;
  }
}