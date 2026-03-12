/** @format */

import {
	index,
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const inboxJobs = sqliteTable(
	"inbox",
	{
		id: text("id").primaryKey(),
		requesterId: text("requester_id").notNull(),
		idempotencyScope: text("idempotency_scope").notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		claimVersion: integer("claim_version").notNull().default(0),
		workerId: text("worker_id"),
		priority: integer("priority").notNull().default(0),
		attemptCount: integer("attempt_count").notNull().default(0),
		maxAttempts: integer("max_attempts").notNull().default(5),
		refreshAttemptCount: integer("refresh_attempt_count")
			.notNull()
			.default(0),
		maxRefreshAttempts: integer("max_refresh_attempts")
			.notNull()
			.default(3),
		scheduledAt: integer("scheduled_at", {
			mode: "timestamp",
		}).notNull(),
		leaseExpiresAt: integer("lease_expires_at", {
			mode: "timestamp",
		}),
		heartbeatAt: integer("heartbeat_at", { mode: "timestamp" }),
		status: text("status", {
			enum: [
				"queued",
				"claimed",
				"fetching",
				"processing",
				"uploading",
				"succeeded",
				"failed",
				"dead_letter",
			],
		}).notNull(),
		sourceKey: text("source_key").notNull(),
		filename: text("filename").notNull(),
		uploadPrefix: text("upload_prefix").notNull(),
		workloadType: text("workload_type", {
			enum: [
				"audio:transcode",
				"audio:analyze",
				"image:transcode",
				"image:thumbnail",
				"image:optimize",
				"video:transcode",
				"video:analyze",
				"video:thumbnail",
				"document:validate",
				"other:other",
			],
		})
			.notNull()
			.default("audio:transcode"),
		transcodeConfigJson: text("transcode_config_json").notNull(),
		storageType: text("storage_type", {
			enum: ["r2", "s3"],
		}).notNull(),
		storageBucket: text("storage_bucket").notNull(),
		storageRegion: text("storage_region"),
		storageEndpoint: text("storage_endpoint"),
		storageAccountId: text("storage_account_id"),
		storageCredsEncrypted: text(
			"storage_creds_encrypted",
		).notNull(),
		storageCredsDekWrapped: text(
			"storage_creds_dek_wrapped",
		).notNull(),
		storageCredsKekId: text("storage_creds_kek_id").notNull(),
		storageCredsEncryptionVersion: integer(
			"storage_creds_encryption_version",
		)
			.notNull()
			.default(1),
		credentialVersion: integer("credential_version")
			.notNull()
			.default(1),
		statusWebhookUrl: text("status_webhook_url"),
		refreshUrl: text("refresh_url"),
		sourceFileId: text("source_file_id"),
		lastError: text("last_error"),
		createdAt: integer("created_at", {
			mode: "timestamp",
		}).notNull(),
		updatedAt: integer("updated_at", {
			mode: "timestamp",
		}).notNull(),
	},
	(table) => ({
		claimScan: index("idx_inbox_claim_scan").on(
			table.status,
			table.scheduledAt,
			table.priority,
			table.leaseExpiresAt,
		),
		leaseRecovery: index("idx_inbox_lease_recovery").on(
			table.status,
			table.leaseExpiresAt,
		),
		workloadIndex: index("idx_inbox_workload").on(
			table.workloadType,
			table.status,
			table.scheduledAt,
		),
		idempotencyUnique: uniqueIndex("idx_inbox_idempotency").on(
			table.idempotencyScope,
			table.idempotencyKey,
		),
	}),
);

export const jobOutboxEvents = sqliteTable(
	"outbox",
	{
		id: text("id").primaryKey(),
		jobId: text("job_id").notNull(),
		requesterId: text("requester_id").notNull(),
		eventType: text("event_type", {
			enum: ["status", "terminal"],
		}).notNull(),
		eventStatus: text("event_status", {
			enum: [
				"queued",
				"claimed",
				"fetching",
				"processing",
				"uploading",
				"succeeded",
				"failed",
				"dead_letter",
			],
		}).notNull(),
		eventId: text("event_id").notNull(),
		payloadJson: text("payload_json").notNull(),
		status: text("status", {
			enum: [
				"pending",
				"claimed",
				"delivered",
				"dead_letter",
			],
		}).notNull(),
		claimVersion: integer("claim_version").notNull().default(0),
		workerId: text("worker_id"),
		attemptCount: integer("attempt_count").notNull().default(0),
		maxAttempts: integer("max_attempts").notNull().default(8),
		scheduledAt: integer("scheduled_at", {
			mode: "timestamp",
		}).notNull(),
		nextAttemptAt: integer("next_attempt_at", {
			mode: "timestamp",
		}).notNull(),
		leaseExpiresAt: integer("lease_expires_at", {
			mode: "timestamp",
		}),
		heartbeatAt: integer("heartbeat_at", { mode: "timestamp" }),
		lastError: text("last_error"),
		createdAt: integer("created_at", {
			mode: "timestamp",
		}).notNull(),
		updatedAt: integer("updated_at", {
			mode: "timestamp",
		}).notNull(),
	},
	(table) => ({
		pollIndex: index("idx_outbox_poll").on(
			table.status,
			table.nextAttemptAt,
			table.leaseExpiresAt,
		),
		eventUnique: uniqueIndex("idx_outbox_event").on(table.eventId),
	}),
);

export const idempotencyKeys = sqliteTable(
	"idempotency_keys",
	{
		id: text("id").primaryKey(),
		scope: text("scope").notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		requestHash: text("request_hash").notNull(),
		responseStatus: integer("response_status").notNull(),
		responseJson: text("response_json").notNull(),
		createdAt: integer("created_at", {
			mode: "timestamp",
		}).notNull(),
		expiresAt: integer("expires_at", {
			mode: "timestamp",
		}).notNull(),
	},
	(table) => ({
		scopeKeyUnique: uniqueIndex("idx_idempotency_scope_key").on(
			table.scope,
			table.idempotencyKey,
		),
	}),
);

export const requesterSigningSecrets = sqliteTable(
	"requester_signing_secrets",
	{
		id: text("id").primaryKey(),
		requesterId: text("requester_id").notNull(),
		secret: text("secret").notNull(),
		isActive: integer("is_active", { mode: "boolean" })
			.notNull()
			.default(true),
		createdAt: integer("created_at", {
			mode: "timestamp",
		}).notNull(),
		updatedAt: integer("updated_at", {
			mode: "timestamp",
		}).notNull(),
	},
	(table) => ({
		requesterActiveIdx: index("idx_requester_signing_active").on(
			table.requesterId,
			table.isActive,
			table.updatedAt,
		),
	}),
);
