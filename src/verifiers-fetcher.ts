import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';

export module VerifiersFetcher {
  export type Verifier = lambda.Function;
  export interface Props {
    readonly verifiers?: Verifier[];
  }
}

export class VerifiersFetcher extends lambda.Function {
  /**
   * The Lambda Function returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param verifiers The user specified verifiers
   */
  constructor(scope: Construct, id: string, verifiers?: VerifiersFetcher.Verifier[]) {
    super(scope, `VerifiersFetcher-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifiers/fetch-verifiers')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
    });
    // Object.fromEntries()
    this.addEnvironment('VERIFIERS', JSON.stringify(

      verifiers?.map(verifier => verifier.functionName) || '[]',
    ),
    );
  }
}