// import {
//   RestApi,
//   AuthorizationType,
//   Resource,
//   IAuthorizer,
//   LambdaIntegration,
// } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';
import { CaRegistrationFunction } from './ca-registrator';
import { DeviceActivator } from './device-activator';

export class JustInTimeRegistration extends Construct {
  // public restApi: RestApi;
  public activator: DeviceActivator;
  public caRegistrationFunction: CaRegistrationFunction;

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
    super(scope, `CaRegisterApi-${id}`);
    this.activator = new DeviceActivator(this, id);
    // this.restApi = props.restApiConfig?.restApi || new RestApi(this, id);
    // const resource: Resource = this.restApi.root.addResource('register');
    this.caRegistrationFunction = new CaRegistrationFunction(this, id, {
      deviceActivatorQueue: this.activator.queue,
      vault: props.vault,
      verifiers: props.verifiers,
    });
    // let authorizationType: AuthorizationType = props.restApiConfig?.authorizationType || AuthorizationType.NONE;
    // let authorizer: IAuthorizer|undefined = props.restApiConfig?.authorizer || undefined;
    // switch (authorizationType) {
    //   case AuthorizationType.COGNITO:
    //   case AuthorizationType.CUSTOM:
    //     if (!authorizer) {
    //       throw new JustInTimeRegistration.LackOfAuthorizerError();
    //     }
    //     resource.addMethod('POST', new LambdaIntegration(this.caRegistrationFunction), {
    //       authorizationType: authorizationType,
    //       authorizer: authorizer,
    //     });
    //     break;
    //   case AuthorizationType.IAM:
    //     resource.addMethod('POST', new LambdaIntegration(this.caRegistrationFunction), {
    //       authorizationType: authorizationType,
    //     });
    //     break;
    //   case AuthorizationType.NONE:
    //   default:
    //     resource.addMethod('POST', new LambdaIntegration(this.caRegistrationFunction));
    // }
  }
}

export module JustInTimeRegistration {
  // export class LackOfAuthorizerError extends Error {
  //   constructor() {
  //     let message = 'You specify authorization type is COGNITO, but not specify authorizer.';
  //     super(message);
  //   }
  // }
  export interface Props {
    vault: CaRegistrationFunction.VaultProps;
    verifiers?: [CaRegistrationFunction.VerifierProps];
    // restApiConfig?: RestApiProps;
  }
  // export interface RestApiProps {
  //   restApi: RestApi;
  //   authorizationType?: AuthorizationType;
  //   authorizer?: IAuthorizer;
  // }
}