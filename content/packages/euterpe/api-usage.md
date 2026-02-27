---
title: Euterpe API usage
description: Auth, enqueue, status, workload tokens, idempotency, webhooks, and credential refresh.
created: 2026-02-27
modified: 2026-02-27
---

# Euterpe API usage

All transcode endpoints require API key authentication. Base path for transcode operations is `/transcode`.

## Authentication

Requests must include a valid Euterpe API key:

- **Header:** `Authorization: Bearer <key>` or `X-API-Key: <key>`
- Keys must start with the prefix `eut_`. Keys are validated against the server’s configured set (env or key file); revoked keys are rejected.
- **401 Unauthorized** — Missing or invalid key.

Environment: `EUTERPE_API_KEY` (single), `EUTERPE_API_KEYS` (comma-separated), or `EUTERPE_KEYS_FILE` (path to file, one key per line). Revocation: `EUTERPE_REVOKED_FILE`.

---

## Routes

| Method | Path              | Description                    |
| ------ | ----------------- | ------------------------------ |
| POST   | `/transcode`      | Enqueue a transcode/workload job |
| GET    | `/transcode/status` | Get job status (query `jobId`) |

---

## POST /transcode

Enqueues a job. Request body is JSON.

### Required fields

- **idempotencyKey** — Client-chosen string; same key + same payload returns cached response; same key + different payload returns `409`.
- **requesterId** — Identifies the caller; used for idempotency scope and webhook signing.
- **sourceKey** — Storage key of the source file (e.g. R2/S3 key).
- **filename** — Base filename for outputs.
- **uploadPrefix** — Prefix for output keys (can be `""`).
- **storage** — Object with `type` (`"r2"` or `"s3"`), `bucket`, `creds` (`accessKeyId`, `secretAccessKey`). For `r2`: `accountId` required. For `s3`: `endpoint` required. Optional: `region`.

### Optional fields

- **workloadType** — `media:kind` token (e.g. `audio:transcode`, `audio:analyze`). Default: `audio:transcode`. See [Workload tokens](#workload-tokens).
- **targets** — Array of transcode targets. Required when `workloadType` is `audio:transcode`. Each item: `codec` (string), `bitrate` (number); optional `outputPrefix`, `outputSuffix` (strings).
- **statusWebhookUrl** — URL for status/terminal webhooks (signed).
- **refreshUrl** — URL for credential refresh when storage creds expire.
- **sourceFileId** — Client-side file id (opaque).
- **maxAttempts** — Max processing attempts (default 5).
- **maxRefreshAttempts** — Max credential refresh attempts (default 3).
- **priority** — Lower number = higher priority (default 0).

### Response

- **202 Accepted** — Job enqueued. Body: `{ jobId, workloadType, status: "queued" }`.
- **400 Bad Request** — Missing/invalid fields (e.g. missing `idempotencyKey`, invalid `workloadType`, invalid storage or targets).
- **409 Conflict** — Idempotency key reuse with a different request body. Message: `"Idempotency key reuse with different payload is not allowed"`.

### Example

Request:

```
POST /transcode
Authorization: Bearer eut_xxx
Content-Type: application/json

{
  "idempotencyKey": "upload-abc-123",
  "requesterId": "org_xyz",
  "sourceKey": "uploads/org_xyz/raw/file.flac",
  "filename": "file",
  "uploadPrefix": "audio/2026",
  "workloadType": "audio:transcode",
  "targets": [
    { "codec": "opus", "bitrate": 128000 },
    { "codec": "flac", "bitrate": 0 }
  ],
  "storage": {
    "type": "r2",
    "accountId": "xxx",
    "bucket": "vesta-media",
    "creds": {
      "accessKeyId": "...",
      "secretAccessKey": "..."
    }
  },
  "statusWebhookUrl": "https://api.example.com/webhooks/euterpe"
}
```

Response (202 Accepted):

```json
{ "jobId": "uuid", "workloadType": "audio:transcode", "status": "queued" }
```

---

## GET /transcode/status

Query parameter: **jobId** (required).

### Response

- **200 OK** — Body includes: `jobId`, `workloadType`, `status`, `requesterId`, `attemptCount`, `maxAttempts`, `claimVersion`, `workerId`, `leaseExpiresAt`, `heartbeatAt`, `credentialVersion`, `sourceFileId`, `error`, `updatedAt` (ISO strings where applicable).
- **400 Bad Request** — Missing `jobId`.
- **404 Not Found** — No job for that id.

### Example

```
GET /transcode/status?jobId=550e8400-e29b-41d4-a716-446655440000
```

Response (200 OK):

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "workloadType": "audio:transcode",
  "status": "processing",
  "requesterId": "org_xyz",
  "attemptCount": 1,
  "maxAttempts": 5,
  "claimVersion": 1,
  "workerId": "worker-1",
  "leaseExpiresAt": "2026-02-27T12:05:00.000Z",
  "heartbeatAt": "2026-02-27T12:04:30.000Z",
  "credentialVersion": 1,
  "sourceFileId": "file_abc",
  "error": null,
  "updatedAt": "2026-02-27T12:04:00.000Z"
}
```

---

## Workload tokens

Workload type is a `media:kind` token (lowercase):

- **Media:** `audio`, `image`, `video`, `document`, `other`
- **Kind:** `transcode`, `analyze`, `thumbnail`, `optimize`, `validate`, `other`

Examples: `audio:transcode`, `audio:analyze`, `image:thumbnail`, `video:transcode`, `document:validate`, `other:other`. Default if omitted: `audio:transcode`. For `audio:transcode`, `targets` must contain at least one transcode target.

---

## Idempotency

- Same `idempotencyKey` and `requesterId` (scope) with **identical** request body → server returns the stored response (e.g. same 202 and `jobId`) and does not create a new job.
- Same key with **different** request body → **409 Conflict** and no new job. Clients must use a new key for a different payload.

---

## Webhook signing

Outbound webhooks (status and terminal events) include headers for verification:

- **x-euterpe-signature** — HMAC-SHA256 of `timestamp.nonce.body` (hex).
- **x-euterpe-timestamp** — Unix ms (replay window ~5 min).
- **x-euterpe-nonce** — UUID (single use within skew window).
- **x-euterpe-event-id** — Event id.

Verification: recompute `HMAC-SHA256(secret, timestamp + "." + nonce + "." + rawBody)` and compare with `x-euterpe-signature` using a constant-time compare; reject if timestamp is outside skew or nonce was already used. Secret is per-requester from DB or fallback `EUTERPE_WEBHOOK_SECRET`.

---

## Credential refresh

If the client provides **refreshUrl**, the worker may POST to it when storage credentials expire or are rejected. Request:

- **Body:** JSON `{ jobId, credentialVersion }`.
- **Headers:** Same signed webhook headers (`x-euterpe-signature`, `x-euterpe-timestamp`, `x-euterpe-nonce`, `x-euterpe-event-id`).

Expected response (200): JSON with new storage creds, e.g.:

```json
{
  "storage": {
    "creds": {
      "accessKeyId": "...",
      "secretAccessKey": "..."
    }
  }
}
```

The worker stores and uses the new creds for that job and increments credential version. Non-2xx or invalid body is treated as refresh failure; retries respect `maxRefreshAttempts`.
