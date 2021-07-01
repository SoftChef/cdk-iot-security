import { Bucket } from '@aws-cdk/aws-s3';

export type Vault = Bucket;
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