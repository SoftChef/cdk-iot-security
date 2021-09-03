import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';

export class ProvisionRole extends Role {
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


export class RegistrationConfigRole extends ProvisionRole {
  constructor(scope: Construct, id: string) {
    super(scope, `RegistrationConfigRole-${id}`);
  }
}

export class FleetProvisioningRole extends ProvisionRole {
  constructor(scope: Construct, id: string) {
    super(scope, `FleetProvisioningRole-${id}`);
  }
}