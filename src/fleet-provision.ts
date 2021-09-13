import * as cdk from '@aws-cdk/core';
import { FleetGenerator } from './components/fleet-generator';
import { GreenGrassV2TokenExchangeRole } from './components/greengrass-v2';
import { FleetProvisioningRole } from './components/provision-role';
import { VaultProps } from './components/vault';

/**
 * The CDK construct providing the funtionality of Fleet-Provision.
 */
export class FleetProvision extends cdk.Construct {
  /**
   * The IAM Role allowing the AWS IoT to complete the automatically provisioning.
   */
  public readonly fleetProvisionRole: FleetProvisioningRole;
  /**
   * The Fleet Generator creating the AWS IoT resources for Fleet-Provision work flow.
   */
  public readonly fleetGenerator: FleetGenerator;
  /**
   * The IAM Role for Greengrass V2 mode.
   *
   * If the Greengrass V2 mode is not specified, it would stay as undefined.
   */
  public readonly greengrassV2TokenExchangeRole?: GreenGrassV2TokenExchangeRole;
  /**
   * Initialize a Fleet-Provision Construct.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: cdk.Construct, id: string, props: FleetProvision.Props) {
    super(scope, id);
    this.fleetProvisionRole = new FleetProvisioningRole(this, id);
    this.fleetGenerator = new FleetGenerator(this, id, {
      vault: props.vault,
      fleetProvisionRole: this.fleetProvisionRole,
      enableGreengrassV2Mode: props.enableGreengrassV2Mode,
    });
  }
}

export module FleetProvision {
  /**
   * The properties to initialize the Fleet-Provision Construct.
   */
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    /**
     * Apply the Greengrass V2 mode or not.
     */
    readonly enableGreengrassV2Mode?: boolean;
  }
}