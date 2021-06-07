import { Construct } from '@aws-cdk/core';
import { RestApi } from '@aws-cdk/aws-apigateway';

import { ClientActivator } from './client-activator';
import { CaRegistrator, VerifierProps } from './ca-registrator';

export interface JitrCoreProps {
    verifiers?: [VerifierProps];
    api?: RestApi;
}

export class JitrCore extends Construct {
    public api: RestApi;
    public activator: ClientActivator;
    public registrator: CaRegistrator;
    constructor(scope: Construct, id: string, props: JitrCoreProps) {
        super(scope, `JitrCore-${id}`);
        this.activator = new ClientActivator(this, id);

        this.api = props.api || new RestApi(this, id);
        const resource = this.api.root.addResource('register');

        this.registrator = new CaRegistrator(this, id, {
            activatorFunction: this.activator.function,
            activatorRole: this.activator.role,
            activatorQueueUrl: this.activator.queue.queueUrl,
            apiResource: resource,
            verifiers: props.verifiers
        })
    }
}