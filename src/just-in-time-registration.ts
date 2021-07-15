import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { Construct } from '@aws-cdk/core';
import {
  CaRegistrator,
  DeviceActivator,
  ReviewReceptor,
  VaultProps,
  VerifiersFetcher,
} from './components';

export module JustInTimeRegistration {
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

export class JustInTimeRegistration extends Construct {
  public readonly caRegistrator: CaRegistrator;
  public readonly deviceActivator: DeviceActivator;
  public readonly reviewReceptor: ReviewReceptor;
  public readonly verifiersFetcher: VerifiersFetcher;
  public readonly vault: VaultProps;

  /**
   * Initialize a Just-In-Time Registration API.
   *
   * This API is
   * consist of three parts, a Registrator mainly
   * registering CA, an Activator mainly activating
   * the device certificate, and a RestApi as the
   * entry of the Registrator.
   *
   * If a RestApi is provided as an input property,
   * This Api would add a POST method to the path
   * '/register'. Otherwise, a RestApi with the same
   * method is created.
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
    this.vault = props.vault;
    this.vault.bucket.grantWrite(this.caRegistrator);
  }
}