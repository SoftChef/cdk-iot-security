const { AwsCdkConstructLibrary } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'YehTarnSu',
  authorAddress: 'yehtarnsu@softchef.com',
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
    'aws-cdk',
  ],
  bundledDeps: [
    'aws-sdk',
    'path',
    'node-forge',
    'softchef-utility',
    '@types/node-forge',
    '@types/node@15.12.4',
    '@aws-sdk/client-iot',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-lambda',
    '@softchef/lambda-events',
  ],
  peerDeps: [
    '@aws-cdk/assert',
  ],
  devDeps: [
    'esbuild',
    'aws-sdk-mock',
    'aws-sdk-client-mock',
  ],
  tsconfig: {
    compilerOptions: {
      allowJs: true,
      lib: [
        'DOM',
        'ES2020',
      ],
    },
  },
  eslintOptions: {
    dirs: ['src', 'src/lambda-assets'],
    fileExtensions: ['.ts', '.js'],
  },
});
project.synth();