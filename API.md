# API Reference

**Classes**

Name|Description
----|-----------
[CaRegistrator](#softchef-cdk-iot-security-caregistrator)|*No description*
[DeviceActivator](#softchef-cdk-iot-security-deviceactivator)|*No description*
[JitrTopicRule](#softchef-cdk-iot-security-jitrtopicrule)|*No description*
[JustInTimeRegistration](#softchef-cdk-iot-security-justintimeregistration)|*No description*
[ReviewAcceptionRole](#softchef-cdk-iot-security-reviewacceptionrole)|*No description*
[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)|*No description*
[VerifiersFetcher](#softchef-cdk-iot-security-verifiersfetcher)|*No description*


**Structs**

Name|Description
----|-----------
[CaRegistrator.Props](#softchef-cdk-iot-security-caregistrator-props)|*No description*
[JustInTimeRegistration.Props](#softchef-cdk-iot-security-justintimeregistration-props)|*No description*
[VaultProps](#softchef-cdk-iot-security-vaultprops)|*No description*
[VerifiersFetcher.Props](#softchef-cdk-iot-security-verifiersfetcher-props)|*No description*



## class CaRegistrator  <a id="softchef-cdk-iot-security-caregistrator"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


Initialize the CA Registrator Function.

```ts
new CaRegistrator(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[CaRegistrator.Props](#softchef-cdk-iot-security-caregistrator-props)</code>)  *No description*
  * **reviewReceptor** (<code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code>)  The AWS SQS Queue collecting the MQTT messages sending from the CA-associated Iot Rule, which sends a message every time a client register its certificate. 
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **verifiers** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  The verifiers to verify the client certificates. __*Optional*__




## class DeviceActivator  <a id="softchef-cdk-iot-security-deviceactivator"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


Inistialize the Device Activator Function.

```ts
new DeviceActivator(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class JitrTopicRule  <a id="softchef-cdk-iot-security-jitrtopicrule"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IInspectable](#aws-cdk-core-iinspectable)
__Extends__: [CfnTopicRule](#aws-cdk-aws-iot-cfntopicrule)

### Initializer




```ts
new JitrTopicRule(queue: ReviewReceptor, id: string)
```

* **queue** (<code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class JustInTimeRegistration  <a id="softchef-cdk-iot-security-justintimeregistration"></a>



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
* **props** (<code>[JustInTimeRegistration.Props](#softchef-cdk-iot-security-justintimeregistration-props)</code>)  *No description*
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  *No description* 
  * **verifiers** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  *No description* __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**caRegistrator** | <code>[CaRegistrator](#softchef-cdk-iot-security-caregistrator)</code> | <span></span>
**deviceActivator** | <code>[DeviceActivator](#softchef-cdk-iot-security-deviceactivator)</code> | <span></span>
**reviewReceptor** | <code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code> | <span></span>
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | <span></span>
**verifiersFetcher** | <code>[VerifiersFetcher](#softchef-cdk-iot-security-verifiersfetcher)</code> | <span></span>



## class ReviewAcceptionRole  <a id="softchef-cdk-iot-security-reviewacceptionrole"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IRole](#aws-cdk-aws-iam-irole), [IGrantable](#aws-cdk-aws-iam-igrantable), [IPrincipal](#aws-cdk-aws-iam-iprincipal), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IIdentity](#aws-cdk-aws-iam-iidentity)
__Extends__: [Role](#aws-cdk-aws-iam-role)

### Initializer


Initialize the Role allowed to push messages into the receptor specified in the argument.

```ts
new ReviewAcceptionRole(reviewReceptor: ReviewReceptor, id: string, principalName: string)
```

* **reviewReceptor** (<code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code>)  The AWS SQS Queue recepting the messages from the IoT Topic Rule.
* **id** (<code>string</code>)  *No description*
* **principalName** (<code>string</code>)  The Principal name of the Resource which is arranged to send in the messages.




## class ReviewReceptor  <a id="softchef-cdk-iot-security-reviewreceptor"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IQueue](#aws-cdk-aws-sqs-iqueue), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource)
__Extends__: [Queue](#aws-cdk-aws-sqs-queue)

### Initializer


Initialize the SQS Queue receiving message from the CA-associated Iot Rules.

```ts
new ReviewReceptor(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*



### Properties


Name | Type | Description 
-----|------|-------------
**acceptionRole** | <code>[ReviewAcceptionRole](#softchef-cdk-iot-security-reviewacceptionrole)</code> | The Role allowed to push messages into this Receptor.
**jitrTopicRule** | <code>[JitrTopicRule](#softchef-cdk-iot-security-jitrtopicrule)</code> | <span></span>



## class VerifiersFetcher  <a id="softchef-cdk-iot-security-verifiersfetcher"></a>



__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


The Lambda Function returning all the verifier name and ARNs.

```ts
new VerifiersFetcher(scope: Construct, id: string, verifiers?: Array<Function>)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **verifiers** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  The user specified verifiers.




## struct Props  <a id="softchef-cdk-iot-security-caregistrator-props"></a>






Name | Type | Description 
-----|------|-------------
**reviewReceptor** | <code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code> | The AWS SQS Queue collecting the MQTT messages sending from the CA-associated Iot Rule, which sends a message every time a client register its certificate.
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**verifiers**? | <code>Array<[Function](#aws-cdk-aws-lambda-function)></code> | The verifiers to verify the client certificates.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-justintimeregistration-props"></a>






Name | Type | Description 
-----|------|-------------
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | <span></span>
**verifiers**? | <code>Array<[Function](#aws-cdk-aws-lambda-function)></code> | __*Optional*__



## struct VaultProps  <a id="softchef-cdk-iot-security-vaultprops"></a>






Name | Type | Description 
-----|------|-------------
**bucket** | <code>[Bucket](#aws-cdk-aws-s3-bucket)</code> | The S3 bucket.
**prefix**? | <code>string</code> | The specified prefix to save the file.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-verifiersfetcher-props"></a>






Name | Type | Description 
-----|------|-------------
**verifiers**? | <code>Array<[Function](#aws-cdk-aws-lambda-function)></code> | __*Optional*__



