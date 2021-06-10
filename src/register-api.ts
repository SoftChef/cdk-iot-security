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
  constructor(scope: Construct, id: string, props: CaRegisterApiProps) {
    super(scope, `CaRegisterApi-${id}`);
    this.activator = new ClientActivator(this, id);

    this.api = props.api || new RestApi(this, id);
    const resource = this.api.root.addResource('register');

    this.registrator = new CaRegistrator(this, id, {
      activatorFunction: this.activator.function,
      activatorRole: this.activator.role,
      activatorQueueUrl: this.activator.queue.queueUrl,
      apiResource: resource,
      verifiers: props.verifiers,
    });
  }
}