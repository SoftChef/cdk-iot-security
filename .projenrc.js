const { AwsCdkConstructLibrary } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'YehTarnSu',
  authorAddress: 'yehtarnsu@softchef.com',
  // jsiiVersion: Semver.caret('1.7.0'),
  cdkVersion: '1.109.0',
  defaultReleaseBranch: 'main',
  name: 'cdk-iot-security',
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
    '@types/node@15.12.4',
    '@aws-sdk/client-iot',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-lambda',
    '@softchef/lambda-events',
    '@softchef/cdk-restapi',
  ],
  devDeps: [
    'aws-sdk-client-mock',
  ],
  tsconfig: {
    compilerOptions: {
      target: 'ES6',
      lib: [
        'DOM',
        'ES2020',
      ],
    },
  },
  eslintOptions: {
    dirs: [
      'src',
      'lambda-assets',
      'lambda-assets/**/**/',
      'lambda-assets/**/**/**/',
    ],
  },
});
project.synth();