import { Construct } from '@aws-cdk/core';
import { CaRegistrationFunction } from './ca-registrator';
import { DeviceActivator } from '../device-activator'

export class JitrCaRegistrationFunction extends CaRegistrationFunction {
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: JitrCaRegistrationFunction.Props) {
    super(scope, `CaRegistrationFunction-${id}`, {
        deviceActivatorQueue: props.deviceActivatorQueue,
        verifiers: props.verifiers,
        vault: props.vault
    });
  }
}

export module JitrCaRegistrationFunction {
  export interface Props {
    /**
     * The AWS SQS Queue collecting the MQTT messages sending
     * from the CA-associated Iot Rule, which sends a message
     * every time a client register its certificate.
     */
     deviceActivatorQueue: DeviceActivator.Queue;
     /**
      * The secure AWS S3 Bucket recepting the CA registration
      * information returned from the CA Registration Function.
      */
     vault: CaRegistrationFunction.VaultProps;
     /**
      * The verifiers to verify the client certificates.
      */
     verifiers?: [CaRegistrationFunction.VerifierProps];
  }
}