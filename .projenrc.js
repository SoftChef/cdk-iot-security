const { AwsCdkConstructLibrary, NpmAccess } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'YehTarnSu',
  authorAddress: 'yehtarnsu@softchef.com',
  cdkVersion: '1.110.1',
  defaultReleaseBranch: 'main',
  name: '@softchef/cdk-iot-security',
  npmAccess: NpmAccess.PUBLIC,
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
  ],
  devDeps: [
    'aws-sdk-client-mock',
    'esbuild',
  ],
  tsconfig: {
    include: [
      'lambda-assets',
    ],
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
    ],
  },
});
project.synth();