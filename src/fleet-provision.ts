import * as cdk from '@aws-cdk/core';
import { FleetGenerator } from './components/fleet-generator';
import { GreenGrassV2TokenExchangeRole } from './components/greengrass-v2';
import { FleetProvisionRole } from './components/provision-role';
import { VaultProps } from './components/vault';

export class FleetProvision extends cdk.Construct {
  public readonly fleetProvisionRole: FleetProvisionRole;
  public readonly fleetGenerator: FleetGenerator;
  public readonly greengrassV2TokenExchangeRole?: GreenGrassV2TokenExchangeRole;
  constructor(scope: cdk.Construct, id: string, props: FleetProvision.Props) {
    super(scope, id);
    if (props.greengrassV2) {
      this.greengrassV2TokenExchangeRole = new GreenGrassV2TokenExchangeRole(this, id);
    }
    this.fleetProvisionRole = new FleetProvisionRole(this, id);
    this.fleetGenerator = new FleetGenerator(this, id, {
      vault: props.vault,
      fleetProvisionRole: this.fleetProvisionRole,
      greengrassV2TokenExchangeRole: this.greengrassV2TokenExchangeRole,
    });
  }
}

export module FleetProvision {
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    readonly greengrassV2?: boolean;
  }
}