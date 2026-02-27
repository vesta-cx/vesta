/** @format */

import { randomUUID } from "node:crypto";
import { buildSignedWebhookHeaders } from "../services/webhook-signing.js";
import {
	claimOutboxBatch,
	getJobWebhookDetails,
	markOutboxDelivered,
	markOutboxFailed,
} from "../services/outbox-repository.js";
import { computeBackoffMs, sleep } from "../services/retry.js";

const POLL_MIN_MS = 500;
const POLL_MAX_MS = 1500;
const LEASE_MS = 90_000;
const CLAIM_BATCH_DEFAULT = Number(process.env["EUTERPE_OUTBOX_BATCH"] ?? 10);
const CONCURRENCY = Number(process.env["EUTERPE_OUTBOX_CONCURRENCY"] ?? 5);

const getWorkerId = (): string =>
	process.env["POD_NAME"] ??
	process.env["HOSTNAME"] ??
	`boot-outbox-${randomUUID()}`;

const jitter = (): number =>
	Math.floor(Math.random() * (POLL_MAX_MS - POLL_MIN_MS + 1)) +
	POLL_MIN_MS;

const deliver = async (workerId: string): Promise<void> => {
	const rows = await claimOutboxBatch({
		workerId,
		limit: CLAIM_BATCH_DEFAULT,
		leaseMs: LEASE_MS,
	});
	if (rows.length === 0) {
		await sleep(jitter());
		return;
	}

	const chunks: Promise<void>[] = [];
	for (const row of rows) {
		chunks.push(
			(async () => {
				try {
					const webhook =
						await getJobWebhookDetails(
							row.jobId,
						);
					if (!webhook?.url) {
						await markOutboxDelivered({
							id: row.id,
							workerId,
							claimVersion:
								row.claimVersion,
						});
						return;
					}
					const body = row.payloadJson;
					const headers =
						await buildSignedWebhookHeaders(
							{
								requesterId:
									webhook.requesterId,
								rawBody: body,
								eventId: row.eventId,
							},
						);
					const response = await fetch(
						webhook.url,
						{
							method: "POST",
							headers,
							body,
						},
					);
					if (response.ok) {
						await markOutboxDelivered({
							id: row.id,
							workerId,
							claimVersion:
								row.claimVersion,
						});
						return;
					}
					await markOutboxFailed({
						id: row.id,
						workerId,
						claimVersion: row.claimVersion,
						error: `Webhook failed with ${response.status}`,
						backoffMs: computeBackoffMs(
							row.attemptCount + 1,
							response.status,
						),
					});
				} catch (error) {
					await markOutboxFailed({
						id: row.id,
						workerId,
						claimVersion: row.claimVersion,
						error:
							error instanceof Error ?
								error.message
							:	String(error),
						backoffMs: computeBackoffMs(
							row.attemptCount + 1,
						),
					});
				}
			})(),
		);
		if (chunks.length >= CONCURRENCY) {
			await Promise.all(chunks.splice(0, chunks.length));
		}
	}
	if (chunks.length > 0) await Promise.all(chunks);
};

export const startOutboxRunner = (): void => {
	const workerId = getWorkerId();
	void (async () => {
		while (true) {
			try {
				await deliver(workerId);
			} catch {
				await sleep(jitter());
			}
		}
	})();
};
