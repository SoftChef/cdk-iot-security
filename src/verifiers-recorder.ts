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
  public readonly fetchAllVerifierFunction: lambda.Function;
  public readonly fetchAllVerifierHttpFunction: lambda.Function;
  constructor(scope: Construct, id: string, props?: VerifiersRecorder.Props) {
    super(scope, `VerifierRecorder-${id}`);
    this.fetchAllVerifierFunction = new FetchAllVerifierFunction(this, id, props?.verifiers);
    this.fetchAllVerifierHttpFunction = new FetchAllVerifierHttpFunction(this, id, this.fetchAllVerifierFunction);
  }
}

class FetchAllVerifierFunction extends lambda.Function {
  /**
   * The Lambda Function returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param verifiers The user specified verifiers
   */
  constructor(scope: Construct, id: string, verifiers?: [VerifiersRecorder.VerifierProps]) {
    super(scope, `FetchAllVerifierFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
    });
    verifiers?.forEach(verifier => {
      this.addEnvironment(verifier.name, verifier.lambdaFunction.functionArn);
    });
  }
}

class FetchAllVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function accepting HTTP requests and returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param fetchAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, fetchAllVerifierFunction: FetchAllVerifierFunction) {
    super(scope, `FetchAllVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.httpHandler',
      environment: {
        FETCH_ALL_VERIFIER_FUNCTION_ARN: fetchAllVerifierFunction.functionArn,
      },
    });
    fetchAllVerifierFunction.grantInvoke(this);
  }
}