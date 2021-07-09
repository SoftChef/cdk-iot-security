import * as cdk from '@aws-cdk/core';
import { FleetGenerator } from './components/fleet-generator';
import { FleetProvisionRole } from './components/fleet-provision-role';
import { VaultProps } from './components/vault';

export module FleetProvision {
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
  }
}

export class FleetProvision extends cdk.Construct {
  public readonly fleetProvisionRole: FleetProvisionRole;
  public readonly fleetGenerator: FleetGenerator;
  constructor(scope: cdk.Construct, id: string, props: FleetProvision.Props) {
    super(scope, id);
    this.fleetProvisionRole = new FleetProvisionRole(this, id);
    this.fleetGenerator = new FleetGenerator(this, id, {
      vault: props.vault,
    });
    this.fleetGenerator.addEnvironment('PROVISIONING_ROLE_ARN', this.fleetProvisionRole.roleArn);
  }
}