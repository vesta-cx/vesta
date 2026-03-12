/** @format */

import { and, asc, eq, gt, isNull, lt, or } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
	db,
	idempotencyKeys,
	inboxJobs,
	jobOutboxEvents,
} from "../db/index.js";
import type {
	EnqueueResponse,
	JobStatus,
	WebhookPayload,
	WorkloadToken,
} from "../types/contracts.js";
import { sql } from "drizzle-orm";

export interface InboxJobRecord {
	id: string;
	requesterId: string;
	status: JobStatus;
	workerId: string | null;
	claimVersion: number;
	attemptCount: number;
	maxAttempts: number;
	refreshAttemptCount: number;
	maxRefreshAttempts: number;
	sourceKey: string;
	filename: string;
	uploadPrefix: string;
	workloadType: WorkloadToken;
	transcodeConfigJson: string;
	storageType: "r2" | "s3";
	storageBucket: string;
	storageRegion: string | null;
	storageEndpoint: string | null;
	storageAccountId: string | null;
	storageCredsEncrypted: string;
	storageCredsDekWrapped: string;
	storageCredsKekId: string;
	storageCredsEncryptionVersion: number;
	credentialVersion: number;
	statusWebhookUrl: string | null;
	refreshUrl: string | null;
	sourceFileId: string | null;
	lastError: string | null;
	scheduledAt: Date;
	leaseExpiresAt: Date | null;
	heartbeatAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

const now = (): Date => new Date();

export const hashRequest = async (input: string): Promise<string> => {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(input),
	);
	return Buffer.from(digest).toString("hex");
};

export const getIdempotentResponse = async (
	scope: string,
	key: string,
): Promise<{
	status: number;
	body: EnqueueResponse;
	requestHash: string;
} | null> => {
	const current = now();
	const [row] = await db
		.select()
		.from(idempotencyKeys)
		.where(
			and(
				eq(idempotencyKeys.scope, scope),
				eq(idempotencyKeys.idempotencyKey, key),
				gt(idempotencyKeys.expiresAt, current),
			),
		)
		.limit(1);
	if (!row) return null;
	return {
		status: row.responseStatus,
		body: JSON.parse(row.responseJson) as EnqueueResponse,
		requestHash: row.requestHash,
	};
};

export const saveIdempotentResponse = async (params: {
	scope: string;
	key: string;
	requestHash: string;
	status: number;
	body: EnqueueResponse;
	ttlHours?: number;
}): Promise<void> => {
	const createdAt = now();
	const ttlHours = params.ttlHours ?? 24;
	const expiresAt = new Date(
		createdAt.getTime() + ttlHours * 60 * 60 * 1000,
	);
	await db
		.insert(idempotencyKeys)
		.values({
			id: randomUUID(),
			scope: params.scope,
			idempotencyKey: params.key,
			requestHash: params.requestHash,
			responseStatus: params.status,
			responseJson: JSON.stringify(params.body),
			createdAt,
			expiresAt,
		})
		.onConflictDoUpdate({
			target: [
				idempotencyKeys.scope,
				idempotencyKeys.idempotencyKey,
			],
			set: {
				requestHash: params.requestHash,
				responseStatus: params.status,
				responseJson: JSON.stringify(params.body),
				expiresAt,
			},
		});
};

export const createInboxJob = async (
	values: Omit<
		typeof inboxJobs.$inferInsert,
		"id" | "createdAt" | "updatedAt" | "scheduledAt" | "status"
	> & { id?: string },
): Promise<InboxJobRecord> => {
	const id = values.id ?? randomUUID();
	const createdAt = now();
	const scheduledAt = createdAt;
	await db.insert(inboxJobs).values({
		...values,
		id,
		status: "queued",
		claimVersion: 0,
		workerId: null,
		attemptCount: 0,
		refreshAttemptCount: 0,
		scheduledAt,
		leaseExpiresAt: null,
		heartbeatAt: null,
		lastError: null,
		createdAt,
		updatedAt: createdAt,
	});
	const [job] = await db
		.select()
		.from(inboxJobs)
		.where(eq(inboxJobs.id, id))
		.limit(1);
	if (!job) throw new Error("Failed to create job");
	return job as InboxJobRecord;
};

export const getInboxJobById = async (
	jobId: string,
): Promise<InboxJobRecord | null> => {
	const [job] = await db
		.select()
		.from(inboxJobs)
		.where(eq(inboxJobs.id, jobId))
		.limit(1);
	return (job as InboxJobRecord | undefined) ?? null;
};

export const claimNextInboxJob = async (params: {
	workerId: string;
	leaseMs: number;
	allowedWorkloads: WorkloadToken[];
}): Promise<InboxJobRecord | null> => {
	const claimedAt = now();
	const leaseExpiresAt = new Date(claimedAt.getTime() + params.leaseMs);
	const candidates = await db
		.select()
		.from(inboxJobs)
		.where(
			and(
				or(
					eq(inboxJobs.status, "queued"),
					eq(inboxJobs.status, "failed"),
				),
				or(
					isNull(inboxJobs.leaseExpiresAt),
					lt(inboxJobs.leaseExpiresAt, claimedAt),
				),
				lt(
					inboxJobs.attemptCount,
					inboxJobs.maxAttempts,
				),
				lt(
					inboxJobs.scheduledAt,
					new Date(claimedAt.getTime() + 1),
				),
				or(
					...params.allowedWorkloads.map(
						(workload) =>
							eq(
								inboxJobs.workloadType,
								workload,
							),
					),
				),
			),
		)
		.orderBy(asc(inboxJobs.priority), asc(inboxJobs.createdAt))
		.limit(3);

	for (const candidate of candidates) {
		const nextVersion = (candidate.claimVersion ?? 0) + 1;
		await db
			.update(inboxJobs)
			.set({
				status: "claimed",
				workerId: params.workerId,
				claimVersion: nextVersion,
				leaseExpiresAt,
				heartbeatAt: claimedAt,
				attemptCount: (candidate.attemptCount ?? 0) + 1,
				updatedAt: claimedAt,
			})
			.where(
				and(
					eq(inboxJobs.id, candidate.id),
					eq(
						inboxJobs.claimVersion,
						candidate.claimVersion,
					),
					or(
						eq(inboxJobs.status, "queued"),
						eq(inboxJobs.status, "failed"),
					),
				),
			);
		const [claimed] = await db
			.select()
			.from(inboxJobs)
			.where(
				and(
					eq(inboxJobs.id, candidate.id),
					eq(inboxJobs.workerId, params.workerId),
					eq(inboxJobs.claimVersion, nextVersion),
					eq(inboxJobs.status, "claimed"),
				),
			)
			.limit(1);
		if (claimed) return claimed as InboxJobRecord;
	}
	return null;
};

export const heartbeatInboxJob = async (params: {
	jobId: string;
	workerId: string;
	claimVersion: number;
	leaseMs: number;
}): Promise<boolean> => {
	const heartbeatAt = now();
	const leaseExpiresAt = new Date(heartbeatAt.getTime() + params.leaseMs);
	await db
		.update(inboxJobs)
		.set({ heartbeatAt, leaseExpiresAt, updatedAt: heartbeatAt })
		.where(
			and(
				eq(inboxJobs.id, params.jobId),
				eq(inboxJobs.workerId, params.workerId),
				eq(inboxJobs.claimVersion, params.claimVersion),
			),
		);
	const [row] = await db
		.select({ id: inboxJobs.id })
		.from(inboxJobs)
		.where(
			and(
				eq(inboxJobs.id, params.jobId),
				eq(inboxJobs.workerId, params.workerId),
				eq(inboxJobs.claimVersion, params.claimVersion),
			),
		)
		.limit(1);
	return Boolean(row);
};

export const transitionInboxStatus = async (params: {
	jobId: string;
	workerId: string;
	claimVersion: number;
	status: JobStatus;
	lastError?: string | null;
	sourceFileId?: string | null;
	terminalPayload?: WebhookPayload;
}): Promise<boolean> => {
	const updatedAt = now();
	const isTerminal =
		params.status === "succeeded" ||
		params.status === "failed" ||
		params.status === "dead_letter";
	await db.transaction(async (tx) => {
		await tx
			.update(inboxJobs)
			.set({
				status: params.status,
				lastError: params.lastError ?? null,
				sourceFileId: params.sourceFileId ?? null,
				workerId: isTerminal ? null : undefined,
				leaseExpiresAt: isTerminal ? null : undefined,
				heartbeatAt: isTerminal ? null : undefined,
				updatedAt,
			})
			.where(
				and(
					eq(inboxJobs.id, params.jobId),
					eq(inboxJobs.workerId, params.workerId),
					eq(
						inboxJobs.claimVersion,
						params.claimVersion,
					),
				),
			);

		const [job] = await tx
			.select()
			.from(inboxJobs)
			.where(eq(inboxJobs.id, params.jobId))
			.limit(1);
		if (!job || !job.statusWebhookUrl) return;
		const eventPayload: WebhookPayload = params.terminalPayload ?? {
			eventId: randomUUID(),
			jobId: job.id,
			requesterId: job.requesterId,
			workloadType: job.workloadType as WorkloadToken,
			status: params.status,
			attemptCount: job.attemptCount,
			updatedAt: updatedAt.toISOString(),
			error: params.lastError ?? null,
		};
		await tx.insert(jobOutboxEvents).values({
			id: randomUUID(),
			jobId: job.id,
			requesterId: job.requesterId,
			eventType:
				(
					params.status === "succeeded" ||
					params.status === "failed" ||
					params.status === "dead_letter"
				) ?
					"terminal"
				:	"status",
			eventStatus: params.status,
			eventId: eventPayload.eventId,
			payloadJson: JSON.stringify(eventPayload),
			status: "pending",
			scheduledAt: updatedAt,
			nextAttemptAt: updatedAt,
			createdAt: updatedAt,
			updatedAt,
		});
	});
	const [row] = await db
		.select({ id: inboxJobs.id })
		.from(inboxJobs)
		.where(
			and(
				eq(inboxJobs.id, params.jobId),
				eq(inboxJobs.workerId, params.workerId),
				eq(inboxJobs.claimVersion, params.claimVersion),
				eq(inboxJobs.status, params.status),
			),
		)
		.limit(1);
	return Boolean(row);
};

export const bumpCredentialVersion = async (params: {
	jobId: string;
	encryptedBlob: string;
	dekWrapped: string;
	kekId: string;
	encryptionVersion: number;
}): Promise<boolean> => {
	await db
		.update(inboxJobs)
		.set({
			storageCredsEncrypted: params.encryptedBlob,
			storageCredsDekWrapped: params.dekWrapped,
			storageCredsKekId: params.kekId,
			storageCredsEncryptionVersion: params.encryptionVersion,
			credentialVersion: sql`${inboxJobs.credentialVersion} + 1`,
			refreshAttemptCount: 0,
			updatedAt: now(),
		})
		.where(eq(inboxJobs.id, params.jobId));
	const [row] = await db
		.select({ id: inboxJobs.id })
		.from(inboxJobs)
		.where(eq(inboxJobs.id, params.jobId))
		.limit(1);
	return Boolean(row);
};

export const incrementRefreshAttempt = async (params: {
	jobId: string;
	workerId: string;
	claimVersion: number;
}): Promise<number> => {
	await db
		.update(inboxJobs)
		.set({
			refreshAttemptCount: sql`${inboxJobs.refreshAttemptCount} + 1`,
			updatedAt: now(),
		})
		.where(
			and(
				eq(inboxJobs.id, params.jobId),
				eq(inboxJobs.workerId, params.workerId),
				eq(inboxJobs.claimVersion, params.claimVersion),
			),
		);
	const [job] = await db
		.select({ refreshAttemptCount: inboxJobs.refreshAttemptCount })
		.from(inboxJobs)
		.where(eq(inboxJobs.id, params.jobId))
		.limit(1);
	return job?.refreshAttemptCount ?? 0;
};
