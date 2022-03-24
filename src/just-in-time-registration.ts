import {
  SqsEventSource,
} from 'aws-cdk-lib/aws-lambda-event-sources';
import {
  Construct,
} from 'constructs';
import {
  CaRegistrator,
  DeviceActivator,
  ReviewReceptor,
  VaultProps,
  VerifiersFetcher,
} from './components';

export module JustInTimeRegistration {
  /**
   * The properties to initialize the Just-in-Time Registration Construct.
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
 * The CDK construct providing the funtionality of JITR.
 */
export class JustInTimeRegistration extends Construct {
  /**
   * The CA Registrator creating the AWS IoT resources for JITP work flow.
   */
  public readonly caRegistrator: CaRegistrator;
  /**
   * The Device Activator activating the device certificate.
   */
  public readonly deviceActivator: DeviceActivator;
  /**
   * The Review Receptor collecting and passing messages to the Device Activator.
   */
  public readonly reviewReceptor: ReviewReceptor;
  /**
   * The Verifiers Fetcher returning all the listed verifiers information.
   */
  public readonly verifiersFetcher: VerifiersFetcher;

  /**
   * Initialize a Just-In-Time Registration API.
   *
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: JustInTimeRegistration.Props) {
    super(scope, `JustInTimeRegistration-${id}`);
    this.verifiersFetcher = new VerifiersFetcher(this, id, {
      verifiers: props.verifiers,
    });
    this.deviceActivator = new DeviceActivator(this, id);
    this.reviewReceptor = new ReviewReceptor(this, id);
    this.reviewReceptor.grantConsumeMessages(this.deviceActivator);
    this.deviceActivator.addEventSource(
      new SqsEventSource(this.reviewReceptor, { batchSize: 1 }),
    );
    this.caRegistrator = new CaRegistrator(this, id, {
      verifiers: props.verifiers,
      vault: props.vault,
    });
  }
}