const { awscdk, AUTOMATION_TOKEN } = require('projen');
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'SoftChef',
  authorEmail: 'yehtarnsu@softchef.com',
  authorUrl: 'https://www.softchef.com',
  authorOrganization: true,
  cdkVersion: '1.73.0',
  defaultReleaseBranch: 'main',
  name: '@softchef/cdk-iot-security',
  description: 'This is a AWS CDK construct package surrounding the topic of the AWS IoT Device registration, mainly implementing the functionalities of JITP, JITR, and Fleet-Provisioning.',
  repositoryUrl: 'https://yehtarnsu@github.com/SoftChef/cdk-iot-security.git',
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-lambda-nodejs',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-apigateway',
    '@aws-cdk/aws-iot',
    '@aws-cdk/aws-dynamodb',
    '@aws-cdk/aws-sqs',
    '@aws-cdk/aws-lambda-event-sources',
    '@aws-cdk/aws-s3',
  ],
  bundledDeps: [
    'joi',
    'node-forge',
    '@types/node-forge',
    '@aws-sdk/client-iam',
    '@aws-sdk/client-iot',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-lambda',
    '@softchef/lambda-events',
    'mqtt',
    '@types/uuid',
    'uuid',
  ],
  devDeps: [
    'aws-sdk-client-mock',
    'aws-iot-device-sdk-v2',
    '@softchef/iot-just-in-time-registration',
    'aws-iot-device-sdk',
    'esbuild',
  ],
  depsUpgradeOptions: {
    ignoreProjen: false,
    workflowOptions: {
      labels: ['auto-approve', 'auto-merge'],
      secret: AUTOMATION_TOKEN,
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['MinCheTsai'],
  },
  tsconfig: {
    compilerOptions: {
      target: 'ES6',
      lib: [
        'DOM',
        'ES2020',
      ],
      esModuleInterop: true,
    },
  },
  keywords: [
    'aws',
    'cdk',
    'construct',
    'JITR',
    'JITP',
    'Fleet-Provisioning',
  ],
});

project.package.addField('resolutions', {
  'jest-environment-jsdom': '27.3.1',
});

project.synth();