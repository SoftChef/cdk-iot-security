import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Construct } from '@aws-cdk/core';

export module VerifiersFetcher {
  export type Verifier = lambda.Function;
  export interface Props {
    readonly verifiers?: Verifier[];
  }
}

export class VerifiersFetcher extends NodejsFunction {
  /**
   * The Lambda Function returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param verifiers The user specified verifiers
   */
  constructor(scope: Construct, id: string, verifiers?: VerifiersFetcher.Verifier[]) {
    super(scope, `VerifiersFetcher-${id}`, {
      entry: path.resolve(__dirname, '../lambda-assets/verifiers/fetch-verifiers/app.ts'),
    });
    this.addEnvironment('VERIFIERS', JSON.stringify(
      verifiers?.map(verifier => verifier.functionName) || '[]',
    ),
    );
  }
}