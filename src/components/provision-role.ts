import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';

/**
 * The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically.
 */
export class ProvisionRole extends Role {
  /**
   * Initialize a provision role.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id: string) {
    super(scope, `ProvisionRole-${id}`, {
      roleName: `ProvisionRoleName-${id}`,
      assumedBy: new ServicePrincipal('iot.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSIoTThingsRegistration'),
      ],
    });
  }
}

/**
 * The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the provision template associated with a specified AWS IoT CA.
 */
export class RegistrationConfigRole extends ProvisionRole {
  /**
   * Initialize a registration configuration role. This construct is for JITP construct.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id: string) {
    super(scope, `RegistrationConfig-${id}`);
  }
}

/**
 * The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the specified AWS IoT Fleet-Provisioning Template.
 */
export class FleetProvisioningRole extends ProvisionRole {
  /**
   * Initialize a Fleet-Provision role. This construct is for Fleet-Provision construct.
   * @param scope
   * @param id
   */
  constructor(scope: Construct, id: string) {
    super(scope, `Fleet-${id}`);
  }
}