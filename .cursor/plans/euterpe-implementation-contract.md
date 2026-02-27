# Euterpe Implementation Contract

## Purpose

This contract defines correctness requirements for Euterpe's inbox/outbox queue system, independent of implementation details. Code, tests, and reviews should validate against this document.

## 1) Core Entities

- `inbox_jobs`: durable work queue for transcoding jobs.
- `job_outbox_events`: durable callback queue for requester notifications.
- `idempotency_keys`: dedupe and replay safety for enqueue and callback processing.

Both `inbox_jobs` and `job_outbox_events` must use the same ownership protocol:
- atomic claim
- lease TTL
- heartbeat
- reclaim on lease expiry
- `claim_version` fencing

## 2) Worker Identity

- Worker ID source order: `POD_NAME` -> `HOSTNAME` -> boot UUID.
- Boot UUID must create a new logical worker identity per process start.

## 3) Inbox Job State Machine

Valid statuses:
- `queued`
- `claimed`
- `fetching`
- `processing`
- `uploading`
- `succeeded` (terminal)
- `failed` (terminal)
- `dead_letter` (terminal)

Allowed transitions:
- `queued -> claimed`
- `claimed -> fetching`
- `fetching -> processing`
- `processing -> uploading`
- `uploading -> succeeded`
- `claimed|fetching|processing|uploading -> queued` (retry/requeue path)
- `claimed|fetching|processing|uploading -> failed`
- `failed -> queued` (only while `attempt_count < max_attempts`)
- `failed -> dead_letter` (when retry budget exhausted or unrecoverable policy)

Any transition attempt outside this table is invalid and must be rejected.

## 4) Claim, Lease, and Fencing Guarantees

On claim:
- set `worker_id`
- set `status=claimed`
- set `lease_expires_at=now+lease_ttl`
- set `heartbeat_at=now`
- increment `claim_version`
- increment `attempt_count` only when a new execution attempt starts

Fencing rule:
- all writes from a worker must include `WHERE job_id=? AND claim_version=?`
- if row count is `0`, the worker is stale and must abort processing

Reclaim rule:
- jobs are reclaimable when `lease_expires_at < now`
- reclaim must allocate a new `claim_version`

## 5) Retry and Backoff Policy

Retryable errors:
- `423`, `500`, `502`, `503`, `504`
- `429` retryable with immediate larger backoff bucket
- `401` and `403` trigger credential refresh flow (see section 7)

Defaults:
- exponential backoff with jitter for retryable classes
- separate counters for:
  - job execution attempts
  - credential refresh attempts
  - outbox delivery attempts

Terminal behavior:
- when `attempt_count >= max_attempts`, set `dead_letter`

## 6) HTTP Contract

### `POST /transcode`
- behavior: enqueue job only
- auth: API key required
- response on accepted job: `202 Accepted`
- idempotent retries with same key and same request hash must return the same logical result (`job_id`)
- same key with different request hash must return conflict error

### `GET /transcode/status`
- response: `200 OK` for valid status reads across all non-error job states
- `404 Not Found` for unknown `job_id`
- `401`/`403` for auth issues
- optional `410 Gone` for pruned historical jobs

## 7) Credential Refresh Contract

Storage auth support:
- primary: short-lived scoped credentials (`read` source, `write` output prefix)
- optional: signed URLs

On `401`/`403` from object storage:
1. worker calls requester `refresh_url` (signed request)
2. requester updates credentials and increments `credential_version`
3. worker re-reads job and proceeds only if `credential_version` advanced

No separate refresh-only status is required; refresh is in-band retry behavior.

## 8) Webhook Contract (Outbox)

Single callback endpoint: `status_webhook_url`
- intermediate events: status + metadata (no outputs required)
- terminal `succeeded`: includes outputs
- terminal `failed`/`dead_letter`: includes normalized error payload

Outbox reliability:
- state transition and outbox insert must occur in the same DB transaction
- every event has stable `event_id`
- callback retries use exponential backoff + jitter
- undeliverable events move to outbox dead-letter

Signing:
- headers:
  - `x-euterpe-signature`
  - `x-euterpe-timestamp`
  - `x-euterpe-nonce`
  - `x-euterpe-event-id`
- signature input: `timestamp + "." + nonce + "." + raw_body`
- algorithm: HMAC-SHA256
- receiver validates:
  - timestamp skew window (default +/-5 minutes)
  - nonce replay window (>=5 minutes)
  - constant-time signature comparison

## 9) Idempotency Contract

Storage:
- source of truth is SQL DB (`idempotency_keys` table)

Scopes:
- enqueue idempotency: `(requester_id, idempotency_key)`
- callback dedupe at receiver: `event_id`

Rules:
- store `request_hash`, response snapshot, and expiry
- same key + same hash returns stored response
- same key + different hash is conflict

## 10) Encryption-at-Rest Contract for Stored Credentials

Use envelope encryption for persisted sensitive credential material:
- DEK per credential blob
- KEK wraps DEK
- persist:
  - `storage_creds_encrypted`
  - `storage_creds_dek_wrapped`
  - `storage_creds_kek_id`
  - `storage_creds_encryption_version`

Associated data (AAD):
- bind ciphertext to `job_id`, `requester_id`, `credential_version`

Operational rules:
- decrypt only at execution time in worker memory
- never log plaintext credentials
- keep non-sensitive routing metadata plaintext for querying
- support key rotation by `kek_id` versioning and compatibility window

## 11) Resource and Disk Safety

- configurable maximum source input size
- each output must not exceed `200%` of source size when source `>1GB`
- always cleanup local temp inputs/outputs in `finally`

## 12) Outbox Polling Defaults

- poll interval: jittered 500ms to 1500ms
- claim batch size:
  - default `10`
  - max configurable `25` for low-CPU pods (~`400m`) pending profiling
- outbound webhook concurrency per worker: default `5`

## 13) DB Engine Parity Requirement

Euterpe must support both:
- SQLite/libsql path
- Postgres path (`FOR UPDATE SKIP LOCKED`)

Behavioral parity requirement:
- claim exclusivity
- lease expiry reclaim
- stale write prevention via `claim_version`
- outbox delivery idempotence

CI must run concurrency tests against both engines before rollout.

## 14) Non-Requirements

- Requester-side reconciler cron is optional for protocol correctness.
- Polling status and webhook callbacks are both supported; webhook is not mandatory for requesters.
