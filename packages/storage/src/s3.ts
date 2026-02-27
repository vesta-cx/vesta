/** @format */

import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
	ListResult,
	ListedObject,
	StorageObject,
	StorageProvider,
} from "./types.js";

export interface S3Config {
	/** Full endpoint URL (e.g. https://xxx.r2.cloudflarestorage.com or https://s3.amazonaws.com) */
	endpoint: string;
	bucket: string;
	accessKeyId: string;
	secretAccessKey: string;
	region?: string;
}

/**
 * Generic S3-compatible storage provider.
 * Accepts any S3-compatible endpoint (R2, AWS S3, MinIO, etc.).
 */
export class S3StorageProvider implements StorageProvider {
	private client: S3Client;
	private bucket: string;

	constructor(config: S3Config) {
		const {
			endpoint,
			bucket,
			accessKeyId,
			secretAccessKey,
			region = "auto",
		} = config;
		this.bucket = bucket;
		this.client = new S3Client({
			region,
			endpoint,
			credentials: { accessKeyId, secretAccessKey },
			forcePathStyle:
				endpoint.includes("localhost") ||
				endpoint.includes("127.0.0.1"),
		});
	}

	private toBody(
		body: ReadableStream | ArrayBuffer | string,
	): ReadableStream<Uint8Array> | Uint8Array | string {
		if (body instanceof ArrayBuffer) return new Uint8Array(body);
		return body;
	}

	async put(
		key: string,
		body: ReadableStream | ArrayBuffer | string,
		contentType: string,
	): Promise<void> {
		await this.client.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: this.toBody(body),
				ContentType: contentType,
			}),
		);
	}

	async get(key: string): Promise<StorageObject | null> {
		try {
			const response = await this.client.send(
				new GetObjectCommand({
					Bucket: this.bucket,
					Key: key,
				}),
			);
			if (!response.Body) return null;
			return {
				body: response.Body as ReadableStream,
				contentType:
					response.ContentType ??
					"application/octet-stream",
				size: response.ContentLength ?? 0,
			};
		} catch (err) {
			const e = err as { name?: string; Code?: string };
			if (e?.name === "NoSuchKey" || e?.Code === "NoSuchKey")
				return null;
			throw err;
		}
	}

	async getSignedUrl(key: string, expiresIn: number): Promise<string> {
		const command = new GetObjectCommand({
			Bucket: this.bucket,
			Key: key,
		});
		return getSignedUrl(this.client, command, { expiresIn });
	}

	async delete(key: string): Promise<void> {
		await this.client.send(
			new DeleteObjectCommand({
				Bucket: this.bucket,
				Key: key,
			}),
		);
	}

	async list(options?: {
		prefix?: string;
		limit?: number;
		cursor?: string;
	}): Promise<ListResult> {
		const response = await this.client.send(
			new ListObjectsV2Command({
				Bucket: this.bucket,
				Prefix: options?.prefix,
				MaxKeys: options?.limit ?? 1000,
				ContinuationToken: options?.cursor,
			}),
		);
		const objects: ListedObject[] = (response.Contents ?? []).map(
			(o) => ({
				key: o.Key ?? "",
				size: o.Size ?? 0,
				uploaded:
					o.LastModified ?
						new Date(o.LastModified)
					:	new Date(0),
			}),
		);
		return {
			objects,
			truncated: response.IsTruncated ?? false,
			cursor: response.NextContinuationToken,
		};
	}
}
