import * as path from 'path';
import * as lambda from '@aws-cdk/aws-lambda';
import { Construct } from '@aws-cdk/core';


export module VerifierRecorder {
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

export class VerifierRecorder extends Construct {
  public readonly fetchAllVerifierFunction: lambda.Function;
  public readonly fetchAllVerifierHttpFunction: lambda.Function;
  public readonly fetchOneVerifierHttpFunction: lambda.Function;
  public readonly writeOneVerifierHttpFunction: lambda.Function;
  public readonly deleteOneVerifierHttpFunction: lambda.Function;
  constructor(scope: Construct, id: string, props: VerifierRecorder.Props) {
    super(scope, `VerifierRecorder-${id}`);
    this.fetchAllVerifierFunction = new GetAllVerifierFunction(this, id, props.verifiers);
    this.fetchAllVerifierHttpFunction = new GetAllVerifierHttpFunction(this, id, this.fetchAllVerifierFunction);
    this.fetchOneVerifierHttpFunction = new GetOneVerifierHttpFunction(this, id, this.fetchAllVerifierFunction);
    this.writeOneVerifierHttpFunction = new WriteOneVerifierHttpFunction(this, id, this.fetchAllVerifierFunction);
    this.deleteOneVerifierHttpFunction = new DeleteOneVerifierHttpFunction(this, id, this.fetchAllVerifierFunction);
  }
}

class GetAllVerifierFunction extends lambda.Function {
  /**
   * The Lambda Function returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param verifiers The user specified verifiers
   */
  constructor(scope: Construct, id: string, verifiers?: [VerifierRecorder.VerifierProps]) {
    super(scope, `GetAllVerifierFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/get-all')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
    });
    verifiers?.forEach(verifier => {
      this.addEnvironment(verifier.name, verifier.lambdaFunction.functionArn);
    });
  }
}

class GetAllVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function accepting HTTP requests and returning all the verifier name and ARNs.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `GetAllVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/get-all-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}
class GetOneVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function receive the parameter in a form like '/{verifierName}',
   * and return the specified verifier information.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `GetOneVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/get-one-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}

class WriteOneVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function receive the HTTP POST request, extract information in a format of
   * { "verifierName": "...", "verifierArn": "..." }, and write the information into the
   * original environment variable. It can either create or update a verifier.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `WriteOneVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/write-one-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}

class DeleteOneVerifierHttpFunction extends lambda.Function {
  /**
   * The Lambda Function receive the parameter in a form like '/{verifierName}',
   * and delete the specified verifier.
   * @param scope
   * @param id
   * @param getAllVerifierFunction The lambda function providing the verifiers information.
   */
  constructor(scope: Construct, id: string, getAllVerifierFunction: GetAllVerifierFunction) {
    super(scope, `DeleteOneVerifierHttpFunction-${id}`, {
      code: lambda.Code.fromAsset(path.resolve(__dirname, '../lambda-assets/verifier-recorder/delete-one-http')),
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'app.handler',
      environment: {
        GET_ALL_VERIFIER_FUNCTION_ARN: getAllVerifierFunction.functionArn,
      },
    });
    getAllVerifierFunction.grantInvoke(this);
  }
}