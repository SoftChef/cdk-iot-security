import { Construct } from '@aws-cdk/core';
import { CaRegistrator } from './ca-registrator';
import { VerifiersFetcher } from '../verifiers-fetcher';
import { VaultProps } from '../vault';

export module JitrCaRegistrator {
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

export class JitrCaRegistrator extends CaRegistrator {
  /**
   * Initialize the CA Registrator Function.
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props: JitrCaRegistrator.Props) {
    super(scope, `CaRegistrationFunction-${id}`, {
      verifiers: props.verifiers,
      vault: props.vault,
    });
  }
}