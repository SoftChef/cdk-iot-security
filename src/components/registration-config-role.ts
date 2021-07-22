import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';

/**
 * The role allowing the CA to complete JITP.
 */
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