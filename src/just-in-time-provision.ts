import { Construct } from '@aws-cdk/core';
import { JitpCaRegistrator } from './ca-registrators';
import { VaultProps } from './vault';

export module JustInTimeProvision {
  export interface Props {
    readonly vault: VaultProps;
  }
}

export class JustInTimeProvision extends Construct {
  public jitpCaRegistrator: JitpCaRegistrator;

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
    this.jitpCaRegistrator = new JitpCaRegistrator(this, id, {
      vault: props.vault,
    });
  }
}