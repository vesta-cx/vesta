/** @format */

import type { Codec } from "../transcode.js";

export type WorkloadMediaType = "audio" | "image" | "video" | "document" | "other";
export type WorkloadKind =
	| "transcode"
	| "analyze"
	| "thumbnail"
	| "optimize"
	| "validate"
	| "other";
export type WorkloadToken = `${WorkloadMediaType}:${WorkloadKind}`;

export interface TranscodeTarget {
	codec: Codec;
	bitrate: number;
	outputPrefix?: string;
	outputSuffix?: string;
}

export interface StorageCreds {
	accessKeyId: string;
	secretAccessKey: string;
}

export interface StorageConfigR2 {
	type: "r2";
	accountId: string;
	bucket: string;
	region?: string;
	creds: StorageCreds;
}

export interface StorageConfigS3 {
	type: "s3";
	endpoint: string;
	bucket: string;
	region?: string;
	creds: StorageCreds;
}

export type JobStorageConfig = StorageConfigR2 | StorageConfigS3;

export interface EnqueueTranscodeRequest {
	idempotencyKey: string;
	requesterId: string;
	workloadType?: WorkloadToken;
	sourceKey: string;
	filename: string;
	uploadPrefix: string;
	targets: TranscodeTarget[];
	statusWebhookUrl?: string;
	refreshUrl?: string;
	sourceFileId?: string;
	maxAttempts?: number;
	maxRefreshAttempts?: number;
	priority?: number;
	storage: JobStorageConfig;
}

export interface EnqueueResponse {
	jobId: string;
	workloadType: WorkloadToken;
	status:
		| "queued"
		| "claimed"
		| "fetching"
		| "processing"
		| "uploading"
		| "succeeded"
		| "failed"
		| "dead_letter";
}

export type JobStatus = EnqueueResponse["status"];

export interface WebhookPayload {
	eventId: string;
	jobId: string;
	requesterId: string;
	workloadType?: WorkloadToken;
	status: JobStatus;
	attemptCount: number;
	updatedAt: string;
	error?: string | null;
	outputs?: Array<{
		id: string;
		key: string;
		codec: Codec;
		bitrate: number;
		sourceFileId: string;
	}>;
	source?: {
		id: string;
		key: string;
		filename: string;
		duration: number;
		uploadedAt: number;
	} | null;
}
