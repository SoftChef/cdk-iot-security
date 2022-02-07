import {
  Bucket,
} from 'aws-cdk-lib/aws-s3';

/**
 * The S3 bucket to save the CA certificate and keys.
 */
export type Vault = Bucket;

/**
 * The data set consist of a S3 bucket construct and the sepcified path prefix.
 */
export interface VaultProps {
  /**
   * The S3 bucket
   */
  readonly bucket: Vault;
  /**
   * The specified prefix to save the file.
   */
  readonly prefix?: string;
}