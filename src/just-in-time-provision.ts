import { Construct } from '@aws-cdk/core';
import {
  CaRegistrationFunction,
  JitpCaRegistrationFunction,
} from './ca-registrators';

export module JustInTimeProvision {
  export interface Props {
    readonly vault: CaRegistrationFunction.VaultProps;
  }
}

export class JustInTimeProvision extends Construct {
  public jitpCaRegistrationFunction: JitpCaRegistrationFunction;

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
    super(scope, `CaRegisterApi-${id}`);
    this.jitpCaRegistrationFunction = new JitpCaRegistrationFunction(this, id, {
      vault: props.vault,
    });
  }
}