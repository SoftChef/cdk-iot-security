import {
  Role,
  ServicePrincipal,
  ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { Construct } from '@aws-cdk/core';
import { VaultProps } from '../vault';
import { CaRegistrator } from './ca-registrator';

export module JitpCaRegistrationFunction {
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
  }
}

export class JitpCaRegistrator extends CaRegistrator {
  public readonly jitpRole: Role;
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: JitpCaRegistrationFunction.Props) {
    super(scope, `JitpCaRegistrator-${id}`, {
      jitp: true,
      vault: props.vault,
    });
    this.jitpRole = new JitpRole(this, id);
    this.addEnvironment('JITP_ROLE_ARN', this.jitpRole.roleArn);
  }
}

class JitpRole extends Role {
  constructor(scope: Construct, id: string) {
    super(scope, `JitpRole-${id}`, {
      roleName: `JitpRoleName-${id}`,
      assumedBy: new ServicePrincipal('iot.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSIoTThingsRegistration'),
      ],
    });
  }
}