import { Construct } from '@aws-cdk/core';
import { CaRegistrationFunction } from './ca-registrator';
import { DeviceActivator } from './device-activator';
import { VerifierRecorder } from './verifier-recorder';

export class JustInTimeRegistration extends Construct {
  public activator: DeviceActivator;
  public caRegistrationFunction: CaRegistrationFunction;
  public verifierRecorder: VerifierRecorder;

  /**
   * Initialize a Just-In-Time Registration API.
   *
   * This API is
   * consist of three parts, a Registrator mainly
   * registering CA, an Activator mainly activating
   * the device certificate, and a RestApi as the
   * entry of the Registrator.
   *
   * If a RestApi is provided as an input property,
   * This Api would add a POST method to the path
   * '/register'. Otherwise, a RestApi with the same
   * method is created.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: JustInTimeRegistration.Props) {
    super(scope, `JustInTimeRegistration-${id}`);
    this.activator = new DeviceActivator(this, id);
    this.verifierRecorder = new VerifierRecorder(this, id);
    this.caRegistrationFunction = new CaRegistrationFunction(this, id, {
      deviceActivatorQueue: this.activator.queue,
      vault: props.vault,
      verifiers: props.verifiers,
    });
  }
}

export module JustInTimeRegistration {
  export interface Props {
    vault: CaRegistrationFunction.VaultProps;
    verifiers?: [VerifierRecorder.VerifierProps];
  }
}