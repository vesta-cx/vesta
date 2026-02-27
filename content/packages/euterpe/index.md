---
title: Euterpe
authors:
description: Queue-based audio (and media) processing service for Vesta. Handles transcoding, analysis, and other workloads via an inbox/outbox pipeline with workload-aware workers.
created: 2025-10-24T14:27:01+02:00
modified: 2026-02-27
license:
license_url:
---

Euterpe is the audio and media processing service for Vesta. When a client enqueues a job (e.g. “transcode this file”), Euterpe stores it in an **inbox**, workers **claim** and process it, and status or completion is reported via **outbox** webhooks and the status API.

## What Euterpe does

- **Enqueue jobs** — Clients send `POST /transcode` with source key, storage config, optional transcode targets, and idempotency/requester identifiers. Jobs are stored in the inbox with a `media:kind` **workload token** (e.g. `audio:transcode`, `audio:analyze`).
- **Queue lifecycle** — Jobs move through states: `queued` → `claimed` → `fetching` → `processing` → `uploading` → `succeeded` (or `failed` / `dead_letter`). Workers claim from the inbox, run the workload, then update status and optionally write **outbox** events for webhook delivery.
- **Workload-aware workers** — Worker pools are configured with allowed workload types. Only jobs whose `workloadType` matches a pool’s allowed list are claimed by that pool (e.g. `audio:transcode` vs `audio:analyze`).
- **Output** — Transcode outputs are written to the client’s storage (R2 or S3) using the credentials provided at enqueue time. Optional **credential refresh** allows the worker to call a client-provided `refreshUrl` when credentials expire.
- **Status and webhooks** — Clients can poll `GET /transcode/status?jobId=...` for current job state. Optionally, Euterpe sends status and terminal events to a **status webhook**; payloads are signed with HMAC for verification.

## Queue architecture

- **Inbox** — Table of jobs (`inbox`). Each job has a unique id, `requesterId`, `workloadType`, storage config (encrypted creds), and status. Workers claim by updating status and lease; heartbeats extend the lease.
- **Outbox** — Table of webhook events (`outbox`). When a job reaches a terminal state (or a status update is emitted), an event is enqueued. A separate outbox runner claims, delivers the HTTP webhook with signed headers, and marks the event delivered or dead-letter.

## Where to find API details

- **[API usage](api-usage.md)** — Auth, `POST /transcode` and `GET /transcode/status`, request/response schemas, workload tokens, idempotency (`409` on key reuse with changed payload), webhook signing headers, and credential refresh endpoint behavior.

## Related

- [Audio Streaming Roadmap](../../projects/audio-streaming-roadmap.md) — How Euterpe fits into the HLS/streaming pipeline (transcoding, R2, manifests).
