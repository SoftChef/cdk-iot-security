import { RestApi, AuthorizationType, Resource, IAuthorizer, LambdaIntegration } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';

import { CaRegistrator, VerifierProps } from './ca-registrator';
import { DeviceActivator } from './device-activator';

export interface JustInTimeRegistrationProps {
  verifiers?: [VerifierProps];
  restApiConfig?: RestApiProps;
}

export interface RestApiProps {
  restApi: RestApi;
  authorizationType?: AuthorizationType;
  authorizer?: IAuthorizer;
}

export class JustInTimeRegistration extends Construct {
  public restApi: RestApi;
  public activator: DeviceActivator;
  public registrator: CaRegistrator;

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
  constructor(scope: Construct, id: string, props: JustInTimeRegistrationProps) {
    super(scope, `CaRegisterApi-${id}`);
    this.activator = new DeviceActivator(this, id);

    this.restApi = props.restApiConfig?.restApi || new RestApi(this, id);
    const resource: Resource = this.restApi.root.addResource('register');

    this.registrator = new CaRegistrator(this, id, {
      activatorFunction: this.activator.function,
      activatorRole: this.activator.role,
      activatorQueueUrl: this.activator.receptor.queueUrl,
      verifiers: props.verifiers,
    });

    let authorizationType: AuthorizationType = props.restApiConfig?.authorizationType || AuthorizationType.NONE;
    switch (authorizationType) {
      case AuthorizationType.COGNITO:
      case AuthorizationType.CUSTOM:
        if (!props.restApiConfig?.authorizer) {
          throw new Error('You specify authorization type is COGNITO, but not specify authorizer.');
        }
        let authorizer: IAuthorizer = props.restApiConfig?.authorizer;
        resource.addMethod('POST', new LambdaIntegration(this.registrator), {
          authorizationType: authorizationType,
          authorizer: authorizer,
        });
        break;
      case AuthorizationType.IAM:
        resource.addMethod('POST', new LambdaIntegration(this.registrator), {
          authorizationType: authorizationType,
        });
        break;
      case AuthorizationType.NONE:
      default:
        resource.addMethod('POST', new LambdaIntegration(this.registrator));
    }
  }
}