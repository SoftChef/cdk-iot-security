import { RestApi } from '@aws-cdk/aws-apigateway';
import { Construct } from '@aws-cdk/core';

import { CaRegistrator, VerifierProps } from './ca-registrator';
import { ClientActivator } from './client-activator';

export interface CaRegisterApiProps {
  verifiers?: [VerifierProps];
  api?: RestApi;
}

export class CaRegisterApi extends Construct {
  public api: RestApi;
  public activator: ClientActivator;
  public registrator: CaRegistrator;

  /**
   * Initialize a CA Registration API.
   *
   * This API is
   * consist of three parts, a Registrator mainly
   * registering CA, an Activator mainly activating
   * the client certificate, and a RestApi as the
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
  constructor(scope: Construct, id: string, props: CaRegisterApiProps) {
    super(scope, `CaRegisterApi-${id}`);
    this.activator = new ClientActivator(this, id);

    this.api = props.api || new RestApi(this, id);
    const resource = this.api.root.addResource('register');

    this.registrator = new CaRegistrator(this, id, {
      activatorFunction: this.activator.function,
      activatorRole: this.activator.role,
      activatorQueueUrl: this.activator.receptor.queueUrl,
      apiResource: resource,
      verifiers: props.verifiers,
    });
  }
}