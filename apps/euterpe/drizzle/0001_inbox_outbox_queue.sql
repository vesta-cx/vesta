DROP TABLE IF EXISTS `transcode_jobs`;

CREATE TABLE `inbox` (
  `id` text PRIMARY KEY NOT NULL,
  `requester_id` text NOT NULL,
  `idempotency_scope` text NOT NULL,
  `idempotency_key` text NOT NULL,
  `claim_version` integer NOT NULL DEFAULT 0,
  `worker_id` text,
  `priority` integer NOT NULL DEFAULT 0,
  `attempt_count` integer NOT NULL DEFAULT 0,
  `max_attempts` integer NOT NULL DEFAULT 5,
  `refresh_attempt_count` integer NOT NULL DEFAULT 0,
  `max_refresh_attempts` integer NOT NULL DEFAULT 3,
  `scheduled_at` integer NOT NULL,
  `lease_expires_at` integer,
  `heartbeat_at` integer,
  `status` text NOT NULL,
  `source_key` text NOT NULL,
  `filename` text NOT NULL,
  `upload_prefix` text NOT NULL,
  `transcode_config_json` text NOT NULL,
  `storage_type` text NOT NULL,
  `storage_bucket` text NOT NULL,
  `storage_region` text,
  `storage_endpoint` text,
  `storage_account_id` text,
  `storage_creds_encrypted` text NOT NULL,
  `storage_creds_dek_wrapped` text NOT NULL,
  `storage_creds_kek_id` text NOT NULL,
  `storage_creds_encryption_version` integer NOT NULL DEFAULT 1,
  `credential_version` integer NOT NULL DEFAULT 1,
  `status_webhook_url` text,
  `refresh_url` text,
  `source_file_id` text,
  `last_error` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX `idx_inbox_claim_scan` ON `inbox` (`status`, `scheduled_at`, `priority`, `lease_expires_at`);
CREATE INDEX `idx_inbox_lease_recovery` ON `inbox` (`status`, `lease_expires_at`);
CREATE UNIQUE INDEX `idx_inbox_idempotency` ON `inbox` (`idempotency_scope`, `idempotency_key`);

CREATE TABLE `outbox` (
  `id` text PRIMARY KEY NOT NULL,
  `job_id` text NOT NULL,
  `requester_id` text NOT NULL,
  `event_type` text NOT NULL,
  `event_status` text NOT NULL,
  `event_id` text NOT NULL,
  `payload_json` text NOT NULL,
  `status` text NOT NULL,
  `claim_version` integer NOT NULL DEFAULT 0,
  `worker_id` text,
  `attempt_count` integer NOT NULL DEFAULT 0,
  `max_attempts` integer NOT NULL DEFAULT 8,
  `scheduled_at` integer NOT NULL,
  `next_attempt_at` integer NOT NULL,
  `lease_expires_at` integer,
  `heartbeat_at` integer,
  `last_error` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX `idx_outbox_poll` ON `outbox` (`status`, `next_attempt_at`, `lease_expires_at`);
CREATE UNIQUE INDEX `idx_outbox_event` ON `outbox` (`event_id`);

CREATE TABLE `idempotency_keys` (
  `id` text PRIMARY KEY NOT NULL,
  `scope` text NOT NULL,
  `idempotency_key` text NOT NULL,
  `request_hash` text NOT NULL,
  `response_status` integer NOT NULL,
  `response_json` text NOT NULL,
  `created_at` integer NOT NULL,
  `expires_at` integer NOT NULL
);

CREATE UNIQUE INDEX `idx_idempotency_scope_key` ON `idempotency_keys` (`scope`, `idempotency_key`);
