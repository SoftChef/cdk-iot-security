import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';

<<<<<<< HEAD:src/components/provision-role.ts
export class ProvisionRole extends Role {
=======
export class RegistrationConfigRole extends Role {
>>>>>>> jitp:src/components/registration-config-role.ts
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

export class JitpRole extends ProvisionRole {}

export class FleetProvisionRole extends ProvisionRole {}