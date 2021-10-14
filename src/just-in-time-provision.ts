import { Construct } from '@aws-cdk/core';
import {
  CaRegistrator,
  DeviceCertificateGenerator,
  RegistrationConfigRole,
  VaultProps,
  VerifiersFetcher,
} from './components';

export module JustInTimeProvision {
  /**
   * The properties to initialize the Just-in-Time Provision Construct.
   */
  export interface Props {
    /**
     * The secure AWS S3 Bucket recepting the CA registration
     * information returned from the CA Registration Function.
     */
    readonly vault: VaultProps;
    /**
      * The verifiers to verify the client certificates.
      */
    readonly verifiers?: VerifiersFetcher.Verifier[];
  }
}

/**
 * The CDK construct providing the funtionality of JITP.
 */
export class JustInTimeProvision extends Construct {
  /**
   * The CA Registrator creating the AWS IoT resources for JITP work flow.
   */
  public caRegistrator: CaRegistrator;
  /**
   * The Device Certificate Generator generating CA-signed certificates.
   */
  public deviceCertificateGenerator: DeviceCertificateGenerator;
  /**
   * The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the provision template associated with a specified AWS IoT CA.
   */
  public readonly registrationConfigRole: RegistrationConfigRole;
  /**
   * The Verifiers Fetcher returning all the listed verifiers information.
   */
  public verifiersFetcher: VerifiersFetcher;
  /**
   * Initialize a Just-In-Time Provision Construct.
   *
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: JustInTimeProvision.Props) {
    super(scope, `JustInTimeProvision-${id}`);
    this.registrationConfigRole = new RegistrationConfigRole(this, id);
    this.caRegistrator = new CaRegistrator(this, id, {
      registrationConfigRole: this.registrationConfigRole,
      vault: props.vault,
      verifiers: props.verifiers,
    });
    this.verifiersFetcher = new VerifiersFetcher(this, id, {
      verifiers: props.verifiers,
    });
    this.deviceCertificateGenerator = new DeviceCertificateGenerator(this, id, {
      vault: props.vault,
    });
  }
}