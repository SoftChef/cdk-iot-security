const { awscdk, AUTOMATION_TOKEN } = require('projen');

const PROJECT_NAME = '@softchef/cdk-iot-security';
const PROJECT_DESCRIPTION = 'This is a AWS CDK construct package surrounding the topic of the AWS IoT Device registration, mainly implementing the functionalities of JITP, JITR, and Fleet-Provisioning.';

const project = new awscdk.AwsCdkConstructLibrary({
  authorName: 'SoftChef',
  authorEmail: 'yehtarnsu@softchef.com',
  authorUrl: 'https://www.softchef.com',
  authorOrganization: true,
  name: PROJECT_NAME,
  description: PROJECT_DESCRIPTION,
  repositoryUrl: 'https://yehtarnsu@github.com/SoftChef/cdk-iot-security.git',
  cdkVersion: '2.1.0',
  majorVersion: 2,
  defaultReleaseBranch: 'main',
  releaseBranches: {
    cdkv1: {
      npmDistTag: 'cdkv1',
      majorVersion: 1,
    },
  },
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

const commonExclude = [
  'cdk.out',
  'cdk.context.json',
  'yarn-error.log',
];

project.npmignore.exclude(...commonExclude);
project.gitignore.exclude(...commonExclude);

project.synth();