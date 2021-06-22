# API Reference

**Classes**

Name|Description
----|-----------
[CaRegistrationFunction](#cdk-iot-security-caregistrationfunction)|*No description*
[DeviceActivator](#cdk-iot-security-deviceactivator)|*No description*
[DeviceActivator.Function](#cdk-iot-security-deviceactivator-function)|*No description*
[DeviceActivator.Queue](#cdk-iot-security-deviceactivator-queue)|*No description*
[DeviceActivator.Queue.PushingRole](#cdk-iot-security-deviceactivator-queue-pushingrole)|The Role allowing pushing messages into a specific Device Activator Queue.
[JustInTimeRegistration](#cdk-iot-security-justintimeregistration)|*No description*


**Structs**

Name|Description
----|-----------
[CaRegistrationFunction.CaRegistrationFunctionProps](#cdk-iot-security-caregistrationfunction-caregistrationfunctionprops)|*No description*
[CaRegistrationFunction.VaultProps](#cdk-iot-security-caregistrationfunction-vaultprops)|*No description*
[CaRegistrationFunction.VerifierProps](#cdk-iot-security-caregistrationfunction-verifierprops)|*No description*
[JustInTimeRegistration.Props](#cdk-iot-security-justintimeregistration-props)|*No description*



## class CaRegistrationFunction  <a id="cdk-iot-security-caregistrationfunction"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [Function](#aws-cdk-aws-lambda-function)

### Initializer


Initialize the CA Registrator Function.

```ts
new CaRegistrationFunction(scope: Construct, id: string, props: CaRegistrationFunctionProps)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[CaRegistrationFunction.CaRegistrationFunctionProps](#cdk-iot-security-caregistrationfunction-caregistrationfunctionprops)</code>)  *No description*
  * **deviceActivatorQueue** (<code>[DeviceActivator.Queue](#cdk-iot-security-deviceactivator-queue)</code>)  The AWS SQS Queue collecting the MQTT messages sending from the CA-associated Iot Rule, which sends a message every time a client register its certificate. 
  * **vault** (<code>[CaRegistrationFunction.VaultProps](#cdk-iot-security-caregistrationfunction-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **verifiers** (<code>Array<[CaRegistrationFunction.VerifierProps](#cdk-iot-security-caregistrationfunction-verifierprops)></code>)  The verifiers to verify the client certificates. __*Optional*__




## class DeviceActivator  <a id="cdk-iot-security-deviceactivator"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer


Initialize the Device Activator.

The Device Activator is mainly consist of three parts,
a Lambda Function providing the Activation functionality,
a Receptor which is a SQS Queue receiving the messages
from the CA-associated Iot Rules created by the Registrator,
and a Role allowing pushing to the Receptor for granting the
Iot Rule through the Registrator.

```ts
new DeviceActivator(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*



### Properties


Name | Type | Description 
-----|------|-------------
**function** | <code>[DeviceActivator.Function](#cdk-iot-security-deviceactivator-function)</code> | The Device Activation Function.
**queue** | <code>[DeviceActivator.Queue](#cdk-iot-security-deviceactivator-queue)</code> | The AWS SQS Queue collecting the messages received from the IoT rules.



## class Function  <a id="cdk-iot-security-deviceactivator-function"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Submodule__: DeviceActivator

__Extends__: [Function](#aws-cdk-aws-lambda-function)

### Initializer


Inistialize the Device Activator Function.

```ts
new DeviceActivator.Function(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class Queue  <a id="cdk-iot-security-deviceactivator-queue"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IQueue](#aws-cdk-aws-sqs-iqueue), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource)
__Submodule__: DeviceActivator

__Extends__: [Queue](#aws-cdk-aws-sqs-queue)

### Initializer


Initialize the SQS Queue receiving message from the CA-associated Iot Rules.

```ts
new DeviceActivator.Queue(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*



### Properties


Name | Type | Description 
-----|------|-------------
**pushingRole** | <code>[DeviceActivator.Queue.PushingRole](#cdk-iot-security-deviceactivator-queue-pushingrole)</code> | <span></span>



## class PushingRole  <a id="cdk-iot-security-deviceactivator-queue-pushingrole"></a>

The Role allowing pushing messages into a specific Device Activator Queue.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IRole](#aws-cdk-aws-iam-irole), [IGrantable](#aws-cdk-aws-iam-igrantable), [IPrincipal](#aws-cdk-aws-iam-iprincipal), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IIdentity](#aws-cdk-aws-iam-iidentity)
__Submodule__: DeviceActivator.Queue

__Extends__: [Role](#aws-cdk-aws-iam-role)

### Initializer




```ts
new DeviceActivator.Queue.PushingRole(queue: Queue, principalName: string)
```

* **queue** (<code>[DeviceActivator.Queue](#cdk-iot-security-deviceactivator-queue)</code>)  *No description*
* **principalName** (<code>string</code>)  *No description*




## class JustInTimeRegistration  <a id="cdk-iot-security-justintimeregistration"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer


Initialize a Just-In-Time Registration API.

This API is
consist of three parts, a Registrator mainly
registering CA, an Activator mainly activating
the device certificate, and a RestApi as the
entry of the Registrator.

If a RestApi is provided as an input property,
This Api would add a POST method to the path
'/register'. Otherwise, a RestApi with the same
method is created.

```ts
new JustInTimeRegistration(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[JustInTimeRegistration.Props](#cdk-iot-security-justintimeregistration-props)</code>)  *No description*
  * **vault** (<code>[CaRegistrationFunction.VaultProps](#cdk-iot-security-caregistrationfunction-vaultprops)</code>)  *No description* 
  * **verifiers** (<code>json</code>)  *No description* __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**activator** | <code>[DeviceActivator](#cdk-iot-security-deviceactivator)</code> | <span></span>
**caRegistrationFunction** | <code>[CaRegistrationFunction](#cdk-iot-security-caregistrationfunction)</code> | <span></span>



## struct CaRegistrationFunctionProps  <a id="cdk-iot-security-caregistrationfunction-caregistrationfunctionprops"></a>






Name | Type | Description 
-----|------|-------------
**deviceActivatorQueue** | <code>[DeviceActivator.Queue](#cdk-iot-security-deviceactivator-queue)</code> | The AWS SQS Queue collecting the MQTT messages sending from the CA-associated Iot Rule, which sends a message every time a client register its certificate.
**vault** | <code>[CaRegistrationFunction.VaultProps](#cdk-iot-security-caregistrationfunction-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**verifiers**? | <code>Array<[CaRegistrationFunction.VerifierProps](#cdk-iot-security-caregistrationfunction-verifierprops)></code> | The verifiers to verify the client certificates.<br/>__*Optional*__



## struct VaultProps  <a id="cdk-iot-security-caregistrationfunction-vaultprops"></a>






Name | Type | Description 
-----|------|-------------
**bucket** | <code>[Bucket](#aws-cdk-aws-s3-bucket)</code> | The S3 bucket.
**prefix** | <code>string</code> | The specified prefix to save the file.



## struct VerifierProps  <a id="cdk-iot-security-caregistrationfunction-verifierprops"></a>






Name | Type | Description 
-----|------|-------------
**lambdaFunction** | <code>[Function](#aws-cdk-aws-lambda-function)</code> | The verifier Lambda Function.
**name** | <code>string</code> | The verifier name.



## struct Props  <a id="cdk-iot-security-justintimeregistration-props"></a>






Name | Type | Description 
-----|------|-------------
**vault** | <code>[CaRegistrationFunction.VaultProps](#cdk-iot-security-caregistrationfunction-vaultprops)</code> | <span></span>
**verifiers**? | <code>json</code> | __*Optional*__



