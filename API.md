# API Reference

**Classes**

Name|Description
----|-----------
[CaRegistrator](#softchef-cdk-iot-security-caregistrator)|The NodeJS Lambda Function having the main functionality of registering a CA on AWS IoT.
[DeviceActivator](#softchef-cdk-iot-security-deviceactivator)|The NodeJS Lambda Function having the main functionality of activating the device certificate and provision the AWS IoT resources.
[DeviceCertificateGenerator](#softchef-cdk-iot-security-devicecertificategenerator)|The NodeJS Lambda Function having the main functionality of generating a device certificate set authenticated by a registered CA.
[FleetGenerator](#softchef-cdk-iot-security-fleetgenerator)|The NodeJS Lambda Function having the main functionality of generating a fleet-provisioning template and a provision-claim certificate on AWS IoT.
[FleetProvision](#softchef-cdk-iot-security-fleetprovision)|The CDK construct providing the funtionality of Fleet-Provision.
[FleetProvisioningRole](#softchef-cdk-iot-security-fleetprovisioningrole)|The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the specified AWS IoT Fleet-Provisioning Template.
[GreenGrassV2TokenExchangeRole](#softchef-cdk-iot-security-greengrassv2tokenexchangerole)|The IAM Role defining the permissions for Greengrass V2 Core Device to access the sevices other than the AWS IoT through token exchanging machanism.
[JitrTopicRule](#softchef-cdk-iot-security-jitrtopicrule)|The AWS IoT topic role listening the MQTT message originating from a deivce triggered JITR event.
[JustInTimeProvision](#softchef-cdk-iot-security-justintimeprovision)|The CDK construct providing the funtionality of JITP.
[JustInTimeRegistration](#softchef-cdk-iot-security-justintimeregistration)|The CDK construct providing the funtionality of JITR.
[ProvisionRole](#softchef-cdk-iot-security-provisionrole)|The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically.
[RegistrationConfigRole](#softchef-cdk-iot-security-registrationconfigrole)|The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the provision template associated with a specified AWS IoT CA.
[ReviewAcceptionRole](#softchef-cdk-iot-security-reviewacceptionrole)|The role allowing other services to push messages into the receptor specified in the argument.
[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)|The SQS queue having the main functionality of receiving message from the CA-associated Iot Rules.
[VerifiersFetcher](#softchef-cdk-iot-security-verifiersfetcher)|The NodeJS Lambda Function having the main functionality of getting all the names of the verifiers.


**Structs**

Name|Description
----|-----------
[CaRegistrator.Props](#softchef-cdk-iot-security-caregistrator-props)|The properties to initialize the CA Registrator.
[DeviceCertificateGenerator.Props](#softchef-cdk-iot-security-devicecertificategenerator-props)|The properties to initialize the Device Certificate Generator.
[FleetGenerator.Props](#softchef-cdk-iot-security-fleetgenerator-props)|The properties to initialize the Fleet Generator.
[FleetProvision.Props](#softchef-cdk-iot-security-fleetprovision-props)|The properties to initialize the Fleet-Provision Construct.
[JustInTimeProvision.Props](#softchef-cdk-iot-security-justintimeprovision-props)|The properties to initialize the Just-in-Time Provision Construct.
[JustInTimeRegistration.Props](#softchef-cdk-iot-security-justintimeregistration-props)|The properties to initialize the Just-in-Time Registration Construct.
[VaultProps](#softchef-cdk-iot-security-vaultprops)|The data set consist of a S3 bucket construct and the sepcified path prefix.
[VerifiersFetcher.Props](#softchef-cdk-iot-security-verifiersfetcher-props)|The properties to initialize the Verifiers Fetcher.



## class CaRegistrator  <a id="softchef-cdk-iot-security-caregistrator"></a>

The NodeJS Lambda Function having the main functionality of registering a CA on AWS IoT.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


Initialize the CA Registrator.

```ts
new CaRegistrator(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[CaRegistrator.Props](#softchef-cdk-iot-security-caregistrator-props)</code>)  *No description*
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **registrationConfigRole** (<code>[RegistrationConfigRole](#softchef-cdk-iot-security-registrationconfigrole)</code>)  The Role for JITP. __*Optional*__
  * **verifiers** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  The verifiers to verify the client certificates. __*Optional*__




## class DeviceActivator  <a id="softchef-cdk-iot-security-deviceactivator"></a>

The NodeJS Lambda Function having the main functionality of activating the device certificate and provision the AWS IoT resources.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


Inistialize the Device Activator.

```ts
new DeviceActivator(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class DeviceCertificateGenerator  <a id="softchef-cdk-iot-security-devicecertificategenerator"></a>

The NodeJS Lambda Function having the main functionality of generating a device certificate set authenticated by a registered CA.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


Initialize the Device Certificate Generator.

```ts
new DeviceCertificateGenerator(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[DeviceCertificateGenerator.Props](#softchef-cdk-iot-security-devicecertificategenerator-props)</code>)  *No description*
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **deviceVault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the Device Certificates generated by the Device Certificate Generator. __*Optional*__




## class FleetGenerator  <a id="softchef-cdk-iot-security-fleetgenerator"></a>

The NodeJS Lambda Function having the main functionality of generating a fleet-provisioning template and a provision-claim certificate on AWS IoT.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


* Inistialize the Fleet Generator.

```ts
new FleetGenerator(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[FleetGenerator.Props](#softchef-cdk-iot-security-fleetgenerator-props)</code>)  *No description*
  * **fleetProvisionRole** (<code>[FleetProvisioningRole](#softchef-cdk-iot-security-fleetprovisioningrole)</code>)  The Role for Fleet Provision. 
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **greengrassV2TokenExchangeRole** (<code>[GreenGrassV2TokenExchangeRole](#softchef-cdk-iot-security-greengrassv2tokenexchangerole)</code>)  The Role for Greeangrass V2 mode. __*Optional*__




## class FleetProvision  <a id="softchef-cdk-iot-security-fleetprovision"></a>

The CDK construct providing the funtionality of Fleet-Provision.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer


Initialize a Fleet-Provision Construct.

```ts
new FleetProvision(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[FleetProvision.Props](#softchef-cdk-iot-security-fleetprovision-props)</code>)  *No description*
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **greengrassV2** (<code>boolean</code>)  Apply the Greengrass V2 mode or not. __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**fleetGenerator** | <code>[FleetGenerator](#softchef-cdk-iot-security-fleetgenerator)</code> | The Fleet Generator creating the AWS IoT resources for Fleet-Provision work flow.
**fleetProvisionRole** | <code>[FleetProvisioningRole](#softchef-cdk-iot-security-fleetprovisioningrole)</code> | The IAM Role allowing the AWS IoT to complete the automatically provisioning.
**greengrassV2TokenExchangeRole**? | <code>[GreenGrassV2TokenExchangeRole](#softchef-cdk-iot-security-greengrassv2tokenexchangerole)</code> | The IAM Role for Greengrass V2 mode.<br/>__*Optional*__



## class FleetProvisioningRole  <a id="softchef-cdk-iot-security-fleetprovisioningrole"></a>

The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the specified AWS IoT Fleet-Provisioning Template.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IRole](#aws-cdk-aws-iam-irole), [IGrantable](#aws-cdk-aws-iam-igrantable), [IPrincipal](#aws-cdk-aws-iam-iprincipal), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IIdentity](#aws-cdk-aws-iam-iidentity)
__Extends__: [ProvisionRole](#softchef-cdk-iot-security-provisionrole)

### Initializer


Initialize a Fleet-Provision role.

This construct is for Fleet-Provision construct.

```ts
new FleetProvisioningRole(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class GreenGrassV2TokenExchangeRole  <a id="softchef-cdk-iot-security-greengrassv2tokenexchangerole"></a>

The IAM Role defining the permissions for Greengrass V2 Core Device to access the sevices other than the AWS IoT through token exchanging machanism.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IRole](#aws-cdk-aws-iam-irole), [IGrantable](#aws-cdk-aws-iam-igrantable), [IPrincipal](#aws-cdk-aws-iam-iprincipal), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IIdentity](#aws-cdk-aws-iam-iidentity)
__Extends__: [Role](#aws-cdk-aws-iam-role)

### Initializer


Initialize the Greengrass V2 Token Exchange Role.

```ts
new GreenGrassV2TokenExchangeRole(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class JitrTopicRule  <a id="softchef-cdk-iot-security-jitrtopicrule"></a>

The AWS IoT topic role listening the MQTT message originating from a deivce triggered JITR event.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IInspectable](#aws-cdk-core-iinspectable)
__Extends__: [CfnTopicRule](#aws-cdk-aws-iot-cfntopicrule)

### Initializer


Initialize the topic rule for JITR work flow.

```ts
new JitrTopicRule(queue: ReviewReceptor, id: string)
```

* **queue** (<code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class JustInTimeProvision  <a id="softchef-cdk-iot-security-justintimeprovision"></a>

The CDK construct providing the funtionality of JITP.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer


Initialize a Just-In-Time Provision Construct.

```ts
new JustInTimeProvision(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[JustInTimeProvision.Props](#softchef-cdk-iot-security-justintimeprovision-props)</code>)  *No description*
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **deviceVault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the Device Certificates generated by the Device Certificate Generator. __*Optional*__
  * **verifiers** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  The verifiers to verify the client certificates. __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**caRegistrator** | <code>[CaRegistrator](#softchef-cdk-iot-security-caregistrator)</code> | The CA Registrator creating the AWS IoT resources for JITP work flow.
**deviceCertificateGenerator** | <code>[DeviceCertificateGenerator](#softchef-cdk-iot-security-devicecertificategenerator)</code> | The Device Certificate Generator generating CA-signed certificates.
**registrationConfigRole** | <code>[RegistrationConfigRole](#softchef-cdk-iot-security-registrationconfigrole)</code> | The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the provision template associated with a specified AWS IoT CA.
**verifiersFetcher** | <code>[VerifiersFetcher](#softchef-cdk-iot-security-verifiersfetcher)</code> | The Verifiers Fetcher returning all the listed verifiers information.



## class JustInTimeRegistration  <a id="softchef-cdk-iot-security-justintimeregistration"></a>

The CDK construct providing the funtionality of JITR.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable)
__Extends__: [Construct](#aws-cdk-core-construct)

### Initializer


Initialize a Just-In-Time Registration API.

```ts
new JustInTimeRegistration(scope: Construct, id: string, props: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[JustInTimeRegistration.Props](#softchef-cdk-iot-security-justintimeregistration-props)</code>)  *No description*
  * **vault** (<code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code>)  The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function. 
  * **verifiers** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  The verifiers to verify the client certificates. __*Optional*__



### Properties


Name | Type | Description 
-----|------|-------------
**caRegistrator** | <code>[CaRegistrator](#softchef-cdk-iot-security-caregistrator)</code> | The CA Registrator creating the AWS IoT resources for JITP work flow.
**deviceActivator** | <code>[DeviceActivator](#softchef-cdk-iot-security-deviceactivator)</code> | The Device Activator activating the device certificate.
**reviewReceptor** | <code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code> | The Review Receptor collecting and passing messages to the Device Activator.
**verifiersFetcher** | <code>[VerifiersFetcher](#softchef-cdk-iot-security-verifiersfetcher)</code> | The Verifiers Fetcher returning all the listed verifiers information.



## class ProvisionRole  <a id="softchef-cdk-iot-security-provisionrole"></a>

The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IRole](#aws-cdk-aws-iam-irole), [IGrantable](#aws-cdk-aws-iam-igrantable), [IPrincipal](#aws-cdk-aws-iam-iprincipal), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IIdentity](#aws-cdk-aws-iam-iidentity)
__Extends__: [Role](#aws-cdk-aws-iam-role)

### Initializer


Initialize a provision role.

```ts
new ProvisionRole(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class RegistrationConfigRole  <a id="softchef-cdk-iot-security-registrationconfigrole"></a>

The IAM Role allowing the AWS IoT to provision the AWS IoT resources automatically according to the provision template associated with a specified AWS IoT CA.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IRole](#aws-cdk-aws-iam-irole), [IGrantable](#aws-cdk-aws-iam-igrantable), [IPrincipal](#aws-cdk-aws-iam-iprincipal), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IIdentity](#aws-cdk-aws-iam-iidentity)
__Extends__: [ProvisionRole](#softchef-cdk-iot-security-provisionrole)

### Initializer


Initialize a registration configuration role.

This construct is for JITP construct.

```ts
new RegistrationConfigRole(scope: Construct, id: string)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*




## class ReviewAcceptionRole  <a id="softchef-cdk-iot-security-reviewacceptionrole"></a>

The role allowing other services to push messages into the receptor specified in the argument.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IRole](#aws-cdk-aws-iam-irole), [IGrantable](#aws-cdk-aws-iam-igrantable), [IPrincipal](#aws-cdk-aws-iam-iprincipal), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IIdentity](#aws-cdk-aws-iam-iidentity)
__Extends__: [Role](#aws-cdk-aws-iam-role)

### Initializer


Initialize the Role allowed other services to push messages into the receptor specified in the argument.

```ts
new ReviewAcceptionRole(reviewReceptor: ReviewReceptor, id: string, principalName: string)
```

* **reviewReceptor** (<code>[ReviewReceptor](#softchef-cdk-iot-security-reviewreceptor)</code>)  The AWS SQS Queue recepting the messages from the IoT Topic Rule.
* **id** (<code>string</code>)  *No description*
* **principalName** (<code>string</code>)  The Principal name of the Resource which is arranged to send in the messages.




## class ReviewReceptor  <a id="softchef-cdk-iot-security-reviewreceptor"></a>

The SQS queue having the main functionality of receiving message from the CA-associated Iot Rules.

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
**jitrTopicRule** | <code>[JitrTopicRule](#softchef-cdk-iot-security-jitrtopicrule)</code> | The topic rule passing messages to this Review Receptor.



## class VerifiersFetcher  <a id="softchef-cdk-iot-security-verifiersfetcher"></a>

The NodeJS Lambda Function having the main functionality of getting all the names of the verifiers.

__Implements__: [IConstruct](#constructs-iconstruct), [IConstruct](#aws-cdk-core-iconstruct), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IResource](#aws-cdk-core-iresource), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IFunction](#aws-cdk-aws-lambda-ifunction), [IConstruct](#constructs-iconstruct), [IDependable](#aws-cdk-core-idependable), [IConstruct](#aws-cdk-core-iconstruct), [IResource](#aws-cdk-core-iresource), [IConnectable](#aws-cdk-aws-ec2-iconnectable), [IGrantable](#aws-cdk-aws-iam-igrantable), [IClientVpnConnectionHandler](#aws-cdk-aws-ec2-iclientvpnconnectionhandler)
__Extends__: [NodejsFunction](#aws-cdk-aws-lambda-nodejs-nodejsfunction)

### Initializer


The Lambda Function returning all the verifier name and ARNs.

```ts
new VerifiersFetcher(scope: Construct, id: string, props?: Props)
```

* **scope** (<code>[Construct](#aws-cdk-core-construct)</code>)  *No description*
* **id** (<code>string</code>)  *No description*
* **props** (<code>[VerifiersFetcher.Props](#softchef-cdk-iot-security-verifiersfetcher-props)</code>)  *No description*
  * **verifiers** (<code>Array<[Function](#aws-cdk-aws-lambda-function)></code>)  *No description* __*Optional*__




## struct Props  <a id="softchef-cdk-iot-security-caregistrator-props"></a>


The properties to initialize the CA Registrator.



Name | Type | Description 
-----|------|-------------
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**registrationConfigRole**? | <code>[RegistrationConfigRole](#softchef-cdk-iot-security-registrationconfigrole)</code> | The Role for JITP.<br/>__*Optional*__
**verifiers**? | <code>Array<[Function](#aws-cdk-aws-lambda-function)></code> | The verifiers to verify the client certificates.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-devicecertificategenerator-props"></a>


The properties to initialize the Device Certificate Generator.



Name | Type | Description 
-----|------|-------------
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**deviceVault**? | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the Device Certificates generated by the Device Certificate Generator.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-fleetgenerator-props"></a>


The properties to initialize the Fleet Generator.



Name | Type | Description 
-----|------|-------------
**fleetProvisionRole** | <code>[FleetProvisioningRole](#softchef-cdk-iot-security-fleetprovisioningrole)</code> | The Role for Fleet Provision.
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**greengrassV2TokenExchangeRole**? | <code>[GreenGrassV2TokenExchangeRole](#softchef-cdk-iot-security-greengrassv2tokenexchangerole)</code> | The Role for Greeangrass V2 mode.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-fleetprovision-props"></a>


The properties to initialize the Fleet-Provision Construct.



Name | Type | Description 
-----|------|-------------
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**greengrassV2**? | <code>boolean</code> | Apply the Greengrass V2 mode or not.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-justintimeprovision-props"></a>


The properties to initialize the Just-in-Time Provision Construct.



Name | Type | Description 
-----|------|-------------
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**deviceVault**? | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the Device Certificates generated by the Device Certificate Generator.<br/>__*Optional*__
**verifiers**? | <code>Array<[Function](#aws-cdk-aws-lambda-function)></code> | The verifiers to verify the client certificates.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-justintimeregistration-props"></a>


The properties to initialize the Just-in-Time Registration Construct.



Name | Type | Description 
-----|------|-------------
**vault** | <code>[VaultProps](#softchef-cdk-iot-security-vaultprops)</code> | The secure AWS S3 Bucket recepting the CA registration information returned from the CA Registration Function.
**verifiers**? | <code>Array<[Function](#aws-cdk-aws-lambda-function)></code> | The verifiers to verify the client certificates.<br/>__*Optional*__



## struct VaultProps  <a id="softchef-cdk-iot-security-vaultprops"></a>


The data set consist of a S3 bucket construct and the sepcified path prefix.



Name | Type | Description 
-----|------|-------------
**bucket** | <code>[Bucket](#aws-cdk-aws-s3-bucket)</code> | The S3 bucket.
**prefix**? | <code>string</code> | The specified prefix to save the file.<br/>__*Optional*__



## struct Props  <a id="softchef-cdk-iot-security-verifiersfetcher-props"></a>


The properties to initialize the Verifiers Fetcher.



Name | Type | Description 
-----|------|-------------
**verifiers**? | <code>Array<[Function](#aws-cdk-aws-lambda-function)></code> | __*Optional*__



