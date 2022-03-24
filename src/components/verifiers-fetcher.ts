import {
  Function,
} from 'aws-cdk-lib/aws-lambda';
import {
  NodejsFunction,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  Construct,
} from 'constructs';

export module VerifiersFetcher {
  /**
   * The verifier to verify the client certificates.
   */
  export type Verifier = Function;
  /**
   * The properties to initialize the Verifiers Fetcher.
   */
  export interface Props {
    readonly verifiers?: Verifier[];
  }
}

/**
 * The NodeJS Lambda Function having the main functionality of getting all the names of the verifiers.
 */
export class VerifiersFetcher extends NodejsFunction {
  /**
   * The Lambda Function returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param verifiers The user specified verifiers
   */
  constructor(scope: Construct, id: string, props?: VerifiersFetcher.Props) {
    super(scope, `VerifiersFetcher-${id}`, {
      entry: `${__dirname}/../../lambda-assets/verifiers/fetch-verifiers/app.ts`,
    });
    this.addEnvironment('VERIFIERS', JSON.stringify(
      props?.verifiers?.map(verifier => verifier.functionName) || '[]',
    ),
    );
  }
}