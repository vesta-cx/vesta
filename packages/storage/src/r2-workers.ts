/** @format */

/// <reference types="@cloudflare/workers-types" />
import type { ListResult, StorageObject, StorageProvider } from "./types.js";

/**
 * R2 storage provider for Cloudflare Workers.
 * Uses the R2Bucket binding (Workers runtime).
 * Note: getSignedUrl throws — R2 doesn't support presigned URLs from Workers; use ephemeral stream tokens.
 */
export class R2StorageProvider implements StorageProvider {
	/** @param bucket - Workers R2Bucket binding (platform.env.AUDIO_BUCKET) */
	constructor(private bucket: R2Bucket) {}

	async list(options?: {
		prefix?: string;
		limit?: number;
		cursor?: string;
	}): Promise<ListResult> {
		const result = await this.bucket.list({
			prefix: options?.prefix,
			limit: options?.limit ?? 1000,
			cursor: options?.cursor,
		});
		const list = result as {
			objects: {
				key: string;
				size: number;
				uploaded?: Date;
			}[];
			truncated?: boolean;
			cursor?: string;
		};
		return {
			objects: (list.objects ?? []).map((o) => ({
				key: o.key,
				size: o.size,
				uploaded:
					o.uploaded ?
						new Date(o.uploaded)
					:	new Date(0),
			})),
			truncated: list.truncated ?? false,
			cursor: list.cursor,
		};
	}

	async put(
		key: string,
		body: ReadableStream | ArrayBuffer | string,
		contentType: string,
	): Promise<void> {
		await this.bucket.put(key, body, {
			httpMetadata: { contentType },
		});
	}

	async get(key: string): Promise<StorageObject | null> {
		const object = await this.bucket.get(key);
		if (!object) return null;

		return {
			body: object.body,
			contentType:
				object.httpMetadata?.contentType ??
				"application/octet-stream",
			size: object.size,
		};
	}

	async getSignedUrl(_key: string, _expiresIn: number): Promise<string> {
		throw new Error(
			"R2 does not support signed URLs from Workers. Use ephemeral stream tokens instead.",
		);
	}

	async delete(key: string): Promise<void> {
		await this.bucket.delete(key);
	}
}
