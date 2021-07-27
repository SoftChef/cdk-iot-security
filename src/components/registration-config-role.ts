import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';

export class RegistrationConfigRole extends Role {
  constructor(scope: Construct, id: string) {
    super(scope, `RegistrationConfigRole-${id}`, {
      roleName: `RegistrationConfigRoleName-${id}`,
      assumedBy: new ServicePrincipal('iot.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSIoTThingsRegistration'),
      ],
    });
  }
}