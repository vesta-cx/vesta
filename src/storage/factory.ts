/** @format */

import type { StorageProvider } from "@vesta-cx/storage";
import { R2S3StorageProvider } from "@vesta-cx/storage/r2-s3";
import { S3StorageProvider } from "@vesta-cx/storage/s3";
import type { JobStorageConfig } from "../types/contracts.js";

export const createStorage = (config: JobStorageConfig): StorageProvider => {
	if (config.type === "r2") {
		return new R2S3StorageProvider({
			accountId: config.accountId,
			bucket: config.bucket,
			accessKeyId: config.creds.accessKeyId,
			secretAccessKey: config.creds.secretAccessKey,
		});
	}
	return new S3StorageProvider({
		endpoint: config.endpoint,
		bucket: config.bucket,
		accessKeyId: config.creds.accessKeyId,
		secretAccessKey: config.creds.secretAccessKey,
	});
};
