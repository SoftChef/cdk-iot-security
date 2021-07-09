import { Construct } from '@aws-cdk/core';
import { CaRegistrator } from './components/ca-registrator';
import { RegistrationConfigRole } from './components/registration-config-role';
import { VaultProps } from './vault';

export module JustInTimeProvision {
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
  }
}

export class JustInTimeProvision extends Construct {
  public caRegistrator: CaRegistrator;
  public readonly registrationConfigRole: RegistrationConfigRole;

  /**
   * Initialize a Just-In-Time Provision Construct.
   *
   * This Construct is consist of a Registrator mainly registering CA.
   *
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: JustInTimeProvision.Props) {
    super(scope, `JustInTimeProvision-${id}`);
    this.registrationConfigRole = new RegistrationConfigRole(this, id);
    this.caRegistrator = new CaRegistrator(this, id, {
      role: this.registrationConfigRole,
      vault: props.vault,
    });
  }
}