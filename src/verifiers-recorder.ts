import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';

export module VerifiersRecorder {
  export interface Props {
    readonly verifiers?: [VerifierProps];
  }
  export interface VerifierProps {
    /**
       * The verifier name.
       */
    readonly name: string;
    /**
       * The verifier Lambda Function
       */
    readonly lambdaFunction: lambda.Function;
  }
}

export class VerifiersRecorder extends Construct {
  public readonly fetchAllVerifierHttpFunction: lambda.Function;
  constructor(scope: Construct, id: string, props: VerifiersRecorder.Props) {
    super(scope, `VerifierRecorder-${id}`);
    this.fetchAllVerifierHttpFunction = new FetchAllVerifierHttpFunction(this, id, props.verifiers);
  }
}

class FetchAllVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param verifiers The user specified verifiers
   */
  constructor(scope: Construct, id: string, verifiers?: [VerifiersRecorder.VerifierProps]) {
    super(scope, `FetchAllVerifierFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifiers-recorder/get-all-verifiers-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
    });
    let verifiersMap: {[key:string]: string} = {};
    verifiers?.forEach(verifier => {
      verifiersMap[verifier.name] = verifier.lambdaFunction.functionArn;
    });
    this.addEnvironment('VERIFIERS', JSON.stringify(verifiersMap));
  }
}