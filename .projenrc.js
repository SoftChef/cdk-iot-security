const { AwsCdkConstructLibrary } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'softchef-iot-lab',
  authorAddress: 'yehtarnsu@softchef.com',
  cdkVersion: '1.109.0',
  defaultReleaseBranch: 'main',
  name: '@softchef/cdk-iot-security',
  repositoryUrl: 'https://github.com/SoftChef/cdk-iot-security',
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
    dirs: ['src', 'lambda-assets'],
  },
});
project.synth();