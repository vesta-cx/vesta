import type { StorageProvider } from '@vesta-cx/storage';
import { R2S3StorageProvider } from '@vesta-cx/storage/r2-s3';
import { S3StorageProvider } from '@vesta-cx/storage/s3';

/** R2: uses accountId to derive endpoint. */
export interface StorageConfigR2 {
	type: 'r2';
	accountId: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
}

/** Generic S3-compatible: client provides full endpoint (AWS S3, MinIO, etc.). */
export interface StorageConfigS3 {
	type: 's3';
	endpoint: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
}

/** Future: UploadThing and other providers. */
export type StorageConfig = StorageConfigR2 | StorageConfigS3;

export const createStorage = (config: StorageConfig): StorageProvider => {
	if (config.type === 'r2') {
		return new R2S3StorageProvider({
			accountId: config.accountId,
			bucket: config.bucket,
			accessKeyId: config.accessKeyId,
			secretAccessKey: config.secretAccessKey
		});
	}
	return new S3StorageProvider({
		endpoint: config.endpoint,
		bucket: config.bucket,
		accessKeyId: config.accessKeyId,
		secretAccessKey: config.secretAccessKey
	});
};
