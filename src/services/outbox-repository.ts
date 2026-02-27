/** @format */

import { and, asc, eq, isNull, lt, or } from "drizzle-orm";
import { db, jobOutboxEvents, inboxJobs } from "../db/index.js";

const now = (): Date => new Date();

export interface OutboxRecord {
	id: string;
	jobId: string;
	eventId: string;
	payloadJson: string;
	status: "pending" | "claimed" | "delivered" | "dead_letter";
	claimVersion: number;
	workerId: string | null;
	attemptCount: number;
	maxAttempts: number;
	nextAttemptAt: Date;
	leaseExpiresAt: Date | null;
}

export const claimOutboxBatch = async (params: {
	workerId: string;
	limit: number;
	leaseMs: number;
}): Promise<OutboxRecord[]> => {
	const claimedAt = now();
	const leaseExpiresAt = new Date(claimedAt.getTime() + params.leaseMs);
	const candidates = await db
		.select()
		.from(jobOutboxEvents)
		.where(
			and(
				eq(jobOutboxEvents.status, "pending"),
				lt(jobOutboxEvents.nextAttemptAt, new Date(claimedAt.getTime() + 1)),
				or(
					isNull(jobOutboxEvents.leaseExpiresAt),
					lt(jobOutboxEvents.leaseExpiresAt, claimedAt),
				),
			),
		)
		.orderBy(asc(jobOutboxEvents.nextAttemptAt), asc(jobOutboxEvents.createdAt))
		.limit(params.limit * 2);

	const claimed: OutboxRecord[] = [];
	for (const candidate of candidates) {
		if (claimed.length >= params.limit) break;
		const nextVersion = (candidate.claimVersion ?? 0) + 1;
		await db
			.update(jobOutboxEvents)
			.set({
				status: "claimed",
				workerId: params.workerId,
				claimVersion: nextVersion,
				leaseExpiresAt,
				heartbeatAt: claimedAt,
				updatedAt: claimedAt,
			})
			.where(
				and(
					eq(jobOutboxEvents.id, candidate.id),
					eq(jobOutboxEvents.claimVersion, candidate.claimVersion),
					eq(jobOutboxEvents.status, "pending"),
				),
			);
		const [row] = await db
			.select()
			.from(jobOutboxEvents)
			.where(
				and(
					eq(jobOutboxEvents.id, candidate.id),
					eq(jobOutboxEvents.workerId, params.workerId),
					eq(jobOutboxEvents.claimVersion, nextVersion),
					eq(jobOutboxEvents.status, "claimed"),
				),
			)
			.limit(1);
		if (row) claimed.push(row as OutboxRecord);
	}
	return claimed;
};

export const markOutboxDelivered = async (params: {
	id: string;
	workerId: string;
	claimVersion: number;
}): Promise<void> => {
	await db
		.update(jobOutboxEvents)
		.set({
			status: "delivered",
			workerId: null,
			leaseExpiresAt: null,
			heartbeatAt: null,
			updatedAt: now(),
		})
		.where(
			and(
				eq(jobOutboxEvents.id, params.id),
				eq(jobOutboxEvents.workerId, params.workerId),
				eq(jobOutboxEvents.claimVersion, params.claimVersion),
			),
		);
};

export const markOutboxFailed = async (params: {
	id: string;
	workerId: string;
	claimVersion: number;
	error: string;
	backoffMs: number;
}): Promise<void> => {
	const ts = now();
	const [existing] = await db
		.select()
		.from(jobOutboxEvents)
		.where(eq(jobOutboxEvents.id, params.id))
		.limit(1);
	if (!existing) return;
	const nextAttempts = (existing.attemptCount ?? 0) + 1;
	const dead = nextAttempts >= existing.maxAttempts;
	await db
		.update(jobOutboxEvents)
		.set({
			status: dead ? "dead_letter" : "pending",
			attemptCount: nextAttempts,
			lastError: params.error,
			nextAttemptAt: new Date(ts.getTime() + params.backoffMs),
			workerId: null,
			leaseExpiresAt: null,
			heartbeatAt: null,
			updatedAt: ts,
		})
		.where(
			and(
				eq(jobOutboxEvents.id, params.id),
				eq(jobOutboxEvents.workerId, params.workerId),
				eq(jobOutboxEvents.claimVersion, params.claimVersion),
			),
		);
};

export const getJobWebhookDetails = async (jobId: string): Promise<{
	url: string | null;
	requesterId: string;
} | null> => {
	const [job] = await db
		.select({
			statusWebhookUrl: inboxJobs.statusWebhookUrl,
			requesterId: inboxJobs.requesterId,
		})
		.from(inboxJobs)
		.where(eq(inboxJobs.id, jobId))
		.limit(1);
	if (!job) return null;
	return { url: job.statusWebhookUrl, requesterId: job.requesterId };
};
