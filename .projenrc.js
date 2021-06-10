const { AwsCdkConstructLibrary } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'YehTarnSu',
  authorAddress: 'yehtarnsu@softchef.com',
  cdkVersion: '1.107.0',
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
    'aws-cdk',
  ],
  deps: [
    '@aws-cdk/assert',
    'aws-sdk',
    'path',
    'node-forge',
    'aws-sdk-mock',
  ],
  devDeps: [
    'esbuild',
    '@types/node-forge',
  ],
  tsconfig: {
    compilerOptions: {
      allowJs: true,
    },
  },
});
project.synth();