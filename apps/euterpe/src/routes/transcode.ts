/** @format */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { apiKeyAuth } from "../middleware/auth.js";
import { db, inboxJobs } from "../db/index.js";
import type {
	EnqueueTranscodeRequest,
	EnqueueResponse,
} from "../types/contracts.js";
import { createInboxJob } from "../services/inbox-repository.js";
import {
	IdempotencyConflictError,
	getExistingIdempotentResult,
	storeIdempotentResult,
} from "../services/idempotency.js";
import { encryptCredentials } from "../services/credential-encryption.js";
import {
	DEFAULT_WORKLOAD,
	normalizeWorkloadToken,
} from "../services/workload-policy.js";

export const transcodeRoutes = new Hono();

transcodeRoutes.use("*", apiKeyAuth);

transcodeRoutes.get("/status", async (c) => {
	const jobId = c.req.query("jobId");
	if (!jobId) return c.json({ error: "Missing jobId" }, 400);

	const [job] = await db
		.select()
		.from(inboxJobs)
		.where(eq(inboxJobs.id, jobId));

	if (!job) return c.json({ error: "Job not found" }, 404);

	return c.json({
		jobId: job.id,
		workloadType: job.workloadType,
		status: job.status,
		requesterId: job.requesterId,
		attemptCount: job.attemptCount,
		maxAttempts: job.maxAttempts,
		claimVersion: job.claimVersion,
		workerId: job.workerId ?? undefined,
		leaseExpiresAt: job.leaseExpiresAt?.toISOString(),
		heartbeatAt: job.heartbeatAt?.toISOString(),
		credentialVersion: job.credentialVersion,
		sourceFileId: job.sourceFileId ?? undefined,
		error: job.lastError ?? undefined,
		updatedAt: job.updatedAt.toISOString(),
	});
});

transcodeRoutes.post("/", async (c) => {
	let request: EnqueueTranscodeRequest;
	try {
		request = (await c.req.json()) as EnqueueTranscodeRequest;
	} catch {
		return c.json({ error: "Invalid JSON body" }, 400);
	}

	if (!request.idempotencyKey || !request.requesterId) {
		return c.json(
			{ error: "Missing idempotencyKey or requesterId" },
			400,
		);
	}
	if (!request.sourceKey || !request.filename) {
		return c.json(
			{
				error: "Missing sourceKey or filename",
			},
			400,
		);
	}
	const normalizedWorkload = normalizeWorkloadToken(request.workloadType);
	if (request.workloadType != null && !normalizedWorkload) {
		return c.json(
			{
				error: "workloadType must be a valid media:kind token (e.g. audio:analyze)",
			},
			400,
		);
	}
	const workloadType = normalizedWorkload ?? DEFAULT_WORKLOAD;
	if (workloadType === "audio:transcode") {
		if (
			!Array.isArray(request.targets) ||
			request.targets.length === 0
		) {
			return c.json(
				{
					error: "targets must contain at least one transcode target",
				},
				400,
			);
		}
	}
	if (!Array.isArray(request.targets)) {
		request.targets = [];
	}
	for (const target of request.targets) {
		if (
			!target ||
			typeof target.codec !== "string" ||
			typeof target.bitrate !== "number"
		) {
			return c.json(
				{ error: "invalid transcode target payload" },
				400,
			);
		}
		if (
			target.outputPrefix != null &&
			typeof target.outputPrefix !== "string"
		) {
			return c.json(
				{
					error: "target.outputPrefix must be a string",
				},
				400,
			);
		}
		if (
			target.outputSuffix != null &&
			typeof target.outputSuffix !== "string"
		) {
			return c.json(
				{
					error: "target.outputSuffix must be a string",
				},
				400,
			);
		}
	}
	if (!request.storage?.type || !request.storage.bucket) {
		return c.json(
			{
				error: "Invalid storage config",
			},
			400,
		);
	}
	if (
		!request.storage.creds?.accessKeyId ||
		!request.storage.creds?.secretAccessKey
	) {
		return c.json({ error: "Storage creds are required" }, 400);
	}
	if (request.storage.type === "r2" && !request.storage.accountId) {
		return c.json({ error: "R2 storage requires accountId" }, 400);
	}
	if (request.storage.type === "s3" && !request.storage.endpoint) {
		return c.json({ error: "S3 storage requires endpoint" }, 400);
	}
	try {
		const existing = await getExistingIdempotentResult({
			scope: request.requesterId,
			key: request.idempotencyKey,
			requestBody: request,
		});
		if (existing) {
			return c.json(existing.body, existing.status as 202);
		}
	} catch (error) {
		if (error instanceof IdempotencyConflictError) {
			return c.json({ error: error.message }, 409);
		}
		throw error;
	}

	const jobId = randomUUID();
	const encrypted = encryptCredentials(
		JSON.stringify(request.storage.creds),
		`${jobId}:${request.requesterId}:1`,
	);
	const job = await createInboxJob({
		id: jobId,
		requesterId: request.requesterId,
		idempotencyScope: request.requesterId,
		idempotencyKey: request.idempotencyKey,
		priority: request.priority ?? 0,
		maxAttempts: request.maxAttempts ?? 5,
		maxRefreshAttempts: request.maxRefreshAttempts ?? 3,
		sourceKey: request.sourceKey,
		filename: request.filename,
		uploadPrefix: request.uploadPrefix,
		workloadType,
		transcodeConfigJson: JSON.stringify({
			targets: request.targets,
			filename: request.filename,
			uploadPrefix: request.uploadPrefix,
			sourceFileId: request.sourceFileId,
		}),
		storageType: request.storage.type,
		storageBucket: request.storage.bucket,
		storageRegion: request.storage.region ?? null,
		storageEndpoint:
			request.storage.type === "s3" ?
				request.storage.endpoint
			:	null,
		storageAccountId:
			request.storage.type === "r2" ?
				request.storage.accountId
			:	null,
		storageCredsEncrypted: encrypted.encryptedBlob,
		storageCredsDekWrapped: encrypted.dekWrapped,
		storageCredsKekId: encrypted.kekId,
		storageCredsEncryptionVersion: encrypted.encryptionVersion,
		credentialVersion: 1,
		statusWebhookUrl: request.statusWebhookUrl ?? null,
		refreshUrl: request.refreshUrl ?? null,
		sourceFileId: request.sourceFileId ?? null,
	});

	const body: EnqueueResponse = {
		jobId: job.id,
		workloadType,
		status: "queued",
	};
	await storeIdempotentResult({
		scope: request.requesterId,
		key: request.idempotencyKey,
		requestBody: request,
		status: 202,
		body,
	});
	return c.json(body, 202);
});
