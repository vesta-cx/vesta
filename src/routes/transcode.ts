/** @format */

import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { apiKeyAuth } from "../middleware/auth.js";
import { transcode } from "../transcode.js";
import { createStorage } from "../storage/factory.js";
import { db, transcodeJobs } from "../db/index.js";
import type { TranscodeConfig } from "../transcode.js";

export const transcodeRoutes = new Hono();

transcodeRoutes.use("*", apiKeyAuth);

transcodeRoutes.get("/status", async (c) => {
	const jobId = c.req.query("jobId");
	if (!jobId) return c.json({ error: "Missing jobId" }, 400);

	const [job] = await db
		.select()
		.from(transcodeJobs)
		.where(eq(transcodeJobs.id, jobId));

	if (!job) return c.json({ error: "Job not found" }, 404);

	return c.json({
		status: job.status,
		sourceFileId: job.sourceFileId ?? undefined,
		error: job.error ?? undefined,
	});
});

transcodeRoutes.post("/", async (c) => {
	const formData = await c.req.formData();
	const file = formData.get("file");
	const configRaw = formData.get("config");

	if (!file || !(file instanceof File)) {
		return c.json({ error: "Missing file" }, 400);
	}
	if (!configRaw || typeof configRaw !== "string") {
		return c.json({ error: "Missing config JSON" }, 400);
	}

	let config: TranscodeConfig;
	try {
		config = JSON.parse(configRaw) as TranscodeConfig;
	} catch {
		return c.json({ error: "Invalid config JSON" }, 400);
	}

	if (!config.targets?.length) {
		return c.json({ error: "Config must include targets" }, 400);
	}
	if (!config.filename || typeof config.uploadPrefix !== "string") {
		return c.json(
			{
				error: "Config must include filename and uploadPrefix",
			},
			400,
		);
	}
	const storageConfig = config.storage;
	if (!storageConfig?.type) {
		return c.json(
			{
				error: "Config must include storage (type, bucket, credentials)",
			},
			400,
		);
	}
	if (
		!storageConfig.bucket ||
		!storageConfig.accessKeyId ||
		!storageConfig.secretAccessKey
	) {
		return c.json(
			{
				error: "Storage config must include bucket, accessKeyId, secretAccessKey",
			},
			400,
		);
	}
	if (storageConfig.type === "r2" && !storageConfig.accountId) {
		return c.json({ error: "R2 storage requires accountId" }, 400);
	}
	if (storageConfig.type === "s3" && !storageConfig.endpoint) {
		return c.json({ error: "S3 storage requires endpoint" }, 400);
	}
	if (
		config.naming?.pattern != null &&
		typeof config.naming.pattern !== "string"
	) {
		return c.json(
			{ error: "naming.pattern must be a string" },
			400,
		);
	}
	if (config.chunks?.segmentDurationMs != null) {
		const ms = config.chunks.segmentDurationMs;
		if (typeof ms !== "number" || ms < 1000 || ms > 60_000) {
			return c.json(
				{
					error: "chunks.segmentDurationMs must be between 1000 and 60000 ms",
				},
				400,
			);
		}
	}

	const jobId = randomUUID();
	const tmpDir = os.tmpdir();
	const tmpPath = path.join(
		tmpDir,
		`euterpe_${jobId}_${path.basename(file.name || "audio.flac")}`,
	);

	const now = new Date();
	await db.insert(transcodeJobs).values({
		id: jobId,
		status: "pending",
		createdAt: now,
		updatedAt: now,
	});

	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(tmpPath, buffer);

	const webhookUrl = config.webhookUrl;

	void (async () => {
		const storage = createStorage(config.storage);

		try {
			await db
				.update(transcodeJobs)
				.set({
					status: "processing",
					updatedAt: new Date(),
				})
				.where(eq(transcodeJobs.id, jobId));

			const result = await transcode(
				tmpPath,
				config,
				storage,
			);

			await db
				.update(transcodeJobs)
				.set({
					status: "complete",
					sourceFileId: result.sourceFileId,
					error: null,
					updatedAt: new Date(),
				})
				.where(eq(transcodeJobs.id, jobId));

			if (webhookUrl) {
				await fetch(webhookUrl, {
					method: "POST",
					headers: {
						"Content-Type":
							"application/json",
					},
					body: JSON.stringify({
						jobId,
						status: "complete",
						sourceFileId:
							result.sourceFileId,
						candidateIds:
							result.candidateIds,
						error: null,
						source: result.source,
						candidates: result.candidates,
					}),
				});
			}
		} catch (err) {
			const msg =
				err instanceof Error ?
					err.message
				:	String(err);
			await db
				.update(transcodeJobs)
				.set({
					status: "failed",
					error: msg,
					updatedAt: new Date(),
				})
				.where(eq(transcodeJobs.id, jobId));
			if (webhookUrl) {
				await fetch(webhookUrl, {
					method: "POST",
					headers: {
						"Content-Type":
							"application/json",
					},
					body: JSON.stringify({
						jobId,
						status: "failed",
						sourceFileId: null,
						candidateIds: [],
						error: msg,
						source: null,
						candidates: [],
					}),
				});
			}
		} finally {
			try {
				fs.unlinkSync(tmpPath);
			} catch {
				// ignore
			}
		}
	})();

	return c.json({ jobId, status: "processing" }, 202);
});
