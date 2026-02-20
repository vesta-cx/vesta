# Euterpe

Node.js microservice that transcodes audio uploads (FLAC, WAV, etc.) to requested codecs (flac, opus, mp3, aac) and writes to client-specified storage (R2/S3-compatible).

## Stack

- Hono, Node.js, ffmpeg (child_process)
- `@vesta-cx/storage` — client-driven: each request includes storage config (R2 or S3 credentials)
- Drizzle ORM + libsql (SQLite-compatible, no native bindings) for job status (`transcode_jobs`)

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

- `POST /transcode` — multipart form: `file`, `config` (JSON). Returns `202 { jobId }`.
- `GET /transcode/status?jobId=x` — job status (pending, processing, complete, failed).
- `GET /health` — health check

## Job status and webhook

Euterpe stores job state in its own DB (SQLite). Clients poll `GET /transcode/status` or rely on the webhook.

On completion, euterpe POSTs to `webhookUrl` with `{ jobId, status, sourceFileId, candidateIds, source, candidates }`. The client persists `source` and `candidates` to its own DB.

## Config shape

Each request includes a `config` JSON field with:

- `targets` — transcoding targets (codec, bitrate)
- `filename` — base name for output files (used in object keys)
- `uploadPrefix` — path prefix in bucket (e.g. `""`, `"sources"`, `"audio/2025"`)
- `webhookUrl` — callback when complete
- `sourceFileId` — optional; client-provided UUID used as `source.id` in webhook (enables writing metadata to DB at submit, then updating on completion)
- `storage` — **client-driven** storage connection:
  - **R2**: `{ type: "r2", accountId, bucket, accessKeyId, secretAccessKey }`
  - **S3**: `{ type: "s3", endpoint, bucket, accessKeyId, secretAccessKey }`

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
