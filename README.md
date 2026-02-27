<!-- @format -->

# Euterpe

Node.js microservice that enqueues and processes audio transcode jobs with ffmpeg using an inbox/outbox queue model with lease-based worker claims and signed status callbacks.

## Stack

- Hono, Node.js, ffmpeg (child_process)
- `@vesta-cx/storage` — client-driven storage access (R2/S3-compatible)
- Drizzle ORM + libsql (SQLite-compatible) for queue tables (`inbox`, `outbox`, `idempotency_keys`)

## Quick start

```bash
pnpm install
pnpm run gen-key   # generate API key, append to .euterpe-api-keys
cp .env.example .env
# Set EUTERPE_API_KEY, DATABASE_URL (default file:./data/euterpe.sqlite; storage is client-driven)
pnpm run db:push   # create DB schema (or use db:migrate)
pnpm run dev
```

## Local dev

1. **Install ffmpeg** (required for transcoding):

   ```bash
   brew install ffmpeg   # macOS
   ```

2. **From `apps/euterpe`:**

   ```bash
   pnpm install
   pnpm run gen-key                    # appends key to .euterpe-api-keys (auth uses this)
   cp .env.example .env               # optional: EUTERPE_API_KEY or DATABASE_URL overrides
   pnpm run db:push                   # create SQLite schema
   pnpm run dev                       # tsx watch → http://localhost:3000
   ```

   Or from monorepo root: `pnpm --filter euterpe dev` (and run other commands with `--filter euterpe`).

## API

- `POST /transcode` — JSON enqueue contract, returns `202 { jobId, status: "queued" }`.
- `GET /transcode/status?jobId=x` — returns `200` and full job status metadata.
- `GET /health` — health check

## Enqueue contract (`POST /transcode`)

Example request body:

```json
{
  "idempotencyKey": "req-123",
  "requesterId": "vesta",
  "workloadType": "audio:transcode",
  "sourceKey": "uploads/raw/song.flac",
  "filename": "song",
  "uploadPrefix": "audio/2026",
  "targets": [
    {
      "codec": "opus",
      "bitrate": 128,
      "outputPrefix": "opus/",
      "outputSuffix": "_opus_128"
    }
  ],
  "statusWebhookUrl": "https://example.com/api/euterpe/status",
  "refreshUrl": "https://example.com/api/euterpe/refresh-credentials",
  "sourceFileId": "optional-source-id",
  "storage": {
    "type": "r2",
    "accountId": "<account>",
    "bucket": "<bucket>",
    "creds": {
      "accessKeyId": "<scoped-key>",
      "secretAccessKey": "<scoped-secret>"
    }
  }
}
```

Notes:

- Idempotency scope is requester + `idempotencyKey`.
- Reusing a key with a different payload returns `409`.
- Storage credentials are encrypted at rest (envelope encryption) in queue storage.
- `workloadType` defaults to `audio:transcode`.
- Workload tokens use `media:kind` format, e.g. `audio:analyze`, `image:optimize`, `video:thumbnail`.
- For each `target`, `outputPrefix` and `outputSuffix` are optional:
  - `outputPrefix` splits at the last `/`: path part + filename prefix part
  - `outputPrefix: "mobile/opus_"` -> path `mobile/`, filename prefix `opus_`
  - `outputPrefix: "mobile/"` -> path `mobile/`, empty filename prefix
  - default prefix: `<codec>/` (path only)
  - default suffix: `_<codec>_<bitrate>`

## Job lifecycle

Statuses:

- `queued -> claimed -> fetching -> processing -> uploading -> succeeded`
- Failure path: `failed` and eventually `dead_letter` when retry budget is exhausted.

Workers enforce claim fencing using `claim_version` + `worker_id`, lease TTL, and heartbeat updates.

## Callback delivery (outbox)

- Every state change writes an outbox event.
- Workers poll and deliver callbacks with retry/backoff + jitter.
- Callback headers:
  - `x-euterpe-signature`
  - `x-euterpe-timestamp`
  - `x-euterpe-nonce`
  - `x-euterpe-event-id`
- Signature input: `timestamp + "." + nonce + "." + raw_body` with HMAC-SHA256.

## Credential refresh

- Storage `401`/`403` triggers worker-side credential refresh via `refreshUrl`.
- Requester rotates scoped credentials and Euterpe increments `credential_version`.
- If refresh and retries are exhausted, job transitions to `dead_letter`.

## Operational defaults

- Job lease TTL: 5m
- Heartbeat interval: 30s
- Outbox poll jitter: 500ms-1500ms
- Outbox claim batch: default 10 (configurable)
- Output guardrail: each output cannot exceed 200% of source size when source > 1GB

## Workload-aware worker pools

Set worker workload allowlists with:

- `EUTERPE_ALLOWED_WORKLOADS=audio:transcode`
- `EUTERPE_ALLOWED_WORKLOADS=audio:analyze`
- `EUTERPE_ALLOWED_WORKLOADS=audio:transcode,audio:analyze`

Workers only claim jobs whose `workloadType` is in their allowlist.

## Tests

```bash
pnpm --filter euterpe test
```

## Deploy

**Docker Compose** (from `apps/euterpe`):

```bash
docker compose up -d
```

**Kubernetes:**

```bash
# Build from monorepo root
docker build -t euterpe:latest -f apps/euterpe/Dockerfile .
# See docs/k8s-deploy.md for full instructions (secret, Ingress, Sona config)
kubectl apply -f k8s/
```

Pointer-compression canary build (optional):

```bash
docker build \
  --build-arg NODE_IMAGE=platformatic/node-caged:25-slim \
  -t euterpe:node-caged-canary \
  -f apps/euterpe/Dockerfile .
```

For benchmark and rollback guidance, see `docs/k8s-deploy.md` ("Node memory canary checklist").
