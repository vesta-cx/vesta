/** @format */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { Readable } from "node:stream";
import { createStorage } from "../storage/factory.js";
import { transcode, type TranscodeConfig } from "../transcode.js";
import {
	bumpCredentialVersion,
	claimNextInboxJob,
	heartbeatInboxJob,
	incrementRefreshAttempt,
	transitionInboxStatus,
	type InboxJobRecord,
} from "../services/inbox-repository.js";
import {
	decryptCredentials,
	encryptCredentials,
} from "../services/credential-encryption.js";
import {
	computeBackoffMs,
	isStorageAuthStatus,
	sleep,
} from "../services/retry.js";
import { requestCredentialRefresh } from "../services/credential-refresh.js";
import { parseAllowedWorkloads } from "../services/workload-policy.js";
import { parseByteSize } from "../services/byte-size.js";

const POLL_BASE_MS = 800;
const LEASE_MS = 5 * 60 * 1000;
const HEARTBEAT_MS = 30_000;

const maxInputSizeBytes = parseByteSize(
	process.env["EUTERPE_MAX_INPUT_BYTES"],
	5 * 1024 * 1024 * 1024,
);

const jitter = (base: number): number =>
	Math.max(100, base + Math.floor(Math.random() * 600));

const getWorkerId = (): string =>
	process.env["POD_NAME"] ??
	process.env["HOSTNAME"] ??
	`boot-${randomUUID()}`;

const aadForJob = (job: InboxJobRecord): string =>
	`${job.id}:${job.requesterId}:${job.credentialVersion}`;

const readStorageConfig = (job: InboxJobRecord) => {
	const credsJson = decryptCredentials(
		{
			encryptedBlob: job.storageCredsEncrypted,
			dekWrapped: job.storageCredsDekWrapped,
			kekId: job.storageCredsKekId,
			encryptionVersion: job.storageCredsEncryptionVersion,
		},
		aadForJob(job),
	);
	const creds = JSON.parse(credsJson) as {
		accessKeyId: string;
		secretAccessKey: string;
	};
	if (job.storageType === "r2") {
		return {
			type: "r2" as const,
			accountId: job.storageAccountId ?? "",
			bucket: job.storageBucket,
			region: job.storageRegion ?? undefined,
			creds,
		};
	}
	return {
		type: "s3" as const,
		endpoint: job.storageEndpoint ?? "",
		bucket: job.storageBucket,
		region: job.storageRegion ?? undefined,
		creds,
	};
};

const writeReadableToFile = async (
	stream: ReadableStream,
	targetPath: string,
): Promise<number> => {
	const reader = stream.getReader();
	const out = fs.createWriteStream(targetPath);
	let written = 0;
	try {
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			if (!value) continue;
			written += value.byteLength;
			if (written > maxInputSizeBytes) {
				throw new Error(
					`Input exceeded max allowed size (${maxInputSizeBytes} bytes)`,
				);
			}
			if (!out.write(value)) await once(out, "drain");
		}
	} finally {
		reader.releaseLock();
		out.end();
		await once(out, "close");
	}
	return written;
};

const ensureOutputSizeGuardrail = (dir: string, inputSize: number): void => {
	if (inputSize <= 1_000_000_000) return;
	const maxOutputBytes = inputSize * 2;
	for (const entry of fs.readdirSync(dir)) {
		const abs = path.join(dir, entry);
		if (!fs.statSync(abs).isFile()) continue;
		if (fs.statSync(abs).size > maxOutputBytes) {
			throw new Error(
				`Output file exceeded 200% guardrail: ${entry}`,
			);
		}
	}
};

const processJob = async (
	job: InboxJobRecord,
	workerId: string,
): Promise<void> => {
	const tempDir = path.join(os.tmpdir(), `euterpe-job-${job.id}`);
	fs.mkdirSync(tempDir, { recursive: true });
	const sourcePath = path.join(tempDir, "source-input.flac");
	const heartbeat = setInterval(() => {
		void heartbeatInboxJob({
			jobId: job.id,
			workerId,
			claimVersion: job.claimVersion,
			leaseMs: LEASE_MS,
		});
	}, HEARTBEAT_MS);

	try {
		await transitionInboxStatus({
			jobId: job.id,
			workerId,
			claimVersion: job.claimVersion,
			status: "fetching",
		});

		const storage = createStorage(readStorageConfig(job));
		const source = await storage.get(job.sourceKey);
		if (!source)
			throw new Error(
				`Source object not found: ${job.sourceKey}`,
			);
		const inputSize = await writeReadableToFile(
			source.body,
			sourcePath,
		);

		await transitionInboxStatus({
			jobId: job.id,
			workerId,
			claimVersion: job.claimVersion,
			status: "processing",
		});

		if (job.workloadType !== "audio:transcode") {
			throw new Error(
				`Workload "${job.workloadType}" is not implemented on this worker image`,
			);
		}
		const config = JSON.parse(
			job.transcodeConfigJson,
		) as TranscodeConfig;
		const result = await transcode(sourcePath, config, storage);
		ensureOutputSizeGuardrail(tempDir, inputSize);

		await transitionInboxStatus({
			jobId: job.id,
			workerId,
			claimVersion: job.claimVersion,
			status: "succeeded",
			sourceFileId: result.sourceFileId,
			terminalPayload: {
				eventId: randomUUID(),
				jobId: job.id,
				requesterId: job.requesterId,
				status: "succeeded",
				attemptCount: job.attemptCount,
				updatedAt: new Date().toISOString(),
				error: null,
				source: {
					id: result.source.id,
					key: result.source.r2Key,
					filename: result.source.filename,
					duration: result.source.duration,
					uploadedAt: result.source.uploadedAt,
				},
				outputs: result.candidates.map((item) => ({
					id: item.id,
					key: item.r2Key,
					codec: item.codec,
					bitrate: item.bitrate,
					sourceFileId: item.sourceFileId,
				})),
			},
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : String(error);
		await transitionInboxStatus({
			jobId: job.id,
			workerId,
			claimVersion: job.claimVersion,
			status:
				job.attemptCount >= job.maxAttempts ?
					"dead_letter"
				:	"failed",
			lastError: message,
		});
		throw error;
	} finally {
		clearInterval(heartbeat);
		try {
			fs.rmSync(tempDir, { recursive: true, force: true });
		} catch {
			// ignore cleanup errors
		}
	}
};

const refreshCredentialsForJob = async (
	job: InboxJobRecord,
	workerId: string,
): Promise<boolean> => {
	if (!job.refreshUrl) return false;
	const attempts = await incrementRefreshAttempt({
		jobId: job.id,
		workerId,
		claimVersion: job.claimVersion,
	});
	if (attempts > job.maxRefreshAttempts) {
		return false;
	}
	try {
		const refreshed = await requestCredentialRefresh({
			jobId: job.id,
			requesterId: job.requesterId,
			refreshUrl: job.refreshUrl,
			credentialVersion: job.credentialVersion,
		});
		if (!refreshed) return false;
		const encrypted = encryptCredentials(
			JSON.stringify(refreshed.storage.creds),
			`${job.id}:${job.requesterId}:${job.credentialVersion + 1}`,
		);
		return await bumpCredentialVersion({
			jobId: job.id,
			encryptedBlob: encrypted.encryptedBlob,
			dekWrapped: encrypted.dekWrapped,
			kekId: encrypted.kekId,
			encryptionVersion: encrypted.encryptionVersion,
		});
	} catch {
		return false;
	}
};

export const startJobRunner = (): void => {
	const workerId = getWorkerId();
	const allowedWorkloads = parseAllowedWorkloads(
		process.env["EUTERPE_ALLOWED_WORKLOADS"],
	);
	const run = async (): Promise<void> => {
		const job = await claimNextInboxJob({
			workerId,
			leaseMs: LEASE_MS,
			allowedWorkloads,
		});
		if (!job) {
			await sleep(jitter(POLL_BASE_MS));
			return;
		}
		try {
			await processJob(job, workerId);
		} catch (error) {
			const msg =
				error instanceof Error ?
					error.message
				:	String(error);
			const authLike =
				/(\b401\b|\b403\b|AccessDenied|ExpiredToken|InvalidAccessKeyId)/i.test(
					msg,
				);
			const statusCode = Number(
				msg.match(/\b(401|403)\b/)?.[1] ?? NaN,
			);
			if (isStorageAuthStatus(statusCode) || authLike) {
				const ok = await refreshCredentialsForJob(
					job,
					workerId,
				);
				if (!ok) {
					await sleep(
						computeBackoffMs(
							job.refreshAttemptCount +
								1,
							statusCode,
						),
					);
				}
			}
		}
	};

	void (async () => {
		while (true) {
			try {
				await run();
			} catch {
				// keep workers alive
				await sleep(jitter(1200));
			}
		}
	})();
};
