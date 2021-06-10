import * as AWS from 'aws-sdk';
import * as AWSMock from 'aws-sdk-mock';

AWS.config.region = 'local';
AWSMock.setSDKInstance(AWS);

test('check 5 + 2', async ()=>{
  expect(5+2).toBe(7);
});