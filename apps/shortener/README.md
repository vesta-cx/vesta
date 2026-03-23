<!-- @format -->

# shortener

`apps/shortener` is the standalone Cloudflare Worker behind `vst.cx`.

It resolves a single slug from Cloudflare KV and issues a `302` redirect to a canonical `https://vesta.cx/...` destination.

## Phase 1 contract

- Public route surface:
  - `GET /health`
  - `GET /:slug`
- Backing store: Cloudflare KV binding `SHORT_LINKS`
- Redirect policy: temporary `302`
- Allowed destinations: `https://vesta.cx/...` only
- Lookup behavior: slugs are normalized to lowercase before lookup
- Query forwarding: incoming query params are appended onto the canonical destination

## Record format

Each KV value is JSON with a stable shape that can support future entity-backed publishing from `apps/web`.

```json
{
  "destinationUrl": "https://vesta.cx/daybreak/new-release",
  "targetType": "release",
  "targetId": "rel_123",
  "workspaceSlug": "daybreak",
  "updatedAt": "2026-03-23T00:00:00.000Z"
}
```

Notes:

- `destinationUrl` must stay on the canonical `https://vesta.cx` origin.
- `targetType` is phase-1 metadata for future control-plane publishing.
- `targetId` and `workspaceSlug` are optional metadata fields.
- The KV key is the normalized slug, for example `daybreak`.

## Manual operator workflow

Until `apps/web` owns publishing, operators manage records directly in KV.

Create or update a slug in dev:

```bash
pnpm --filter shortener exec wrangler kv key put --binding SHORT_LINKS "daybreak" '{"destinationUrl":"https://vesta.cx/daybreak/new-release","targetType":"release","targetId":"rel_123","workspaceSlug":"daybreak","updatedAt":"2026-03-23T00:00:00.000Z"}' --env dev --remote
```

Reserved probe slugs like `health`, `favicon.ico`, `robots.txt`, and `sitemap.xml` are hard-404s. Do not seed KV entries for them; choose an alternate slug instead.

Read a slug in dev:

```bash
pnpm --filter shortener exec wrangler kv key get --binding SHORT_LINKS "daybreak" --text --env dev --remote
```

Delete a slug in dev:

```bash
pnpm --filter shortener exec wrangler kv key delete --binding SHORT_LINKS "daybreak" --env dev --remote
```

Swap `--env dev` for `--env prod` when targeting production.

For local verification against local KV state, swap `--remote` for `--local` and run `pnpm --filter shortener dev`.

## Observability

The Worker emits structured logs for:

- successful redirects
- missing slugs
- reserved slug probes
- invalid record payloads
- invalid destinations

This keeps user-facing failures simple while still giving operators enough signal to debug bad data or unexpected traffic.

## Scripts

```bash
pnpm --filter shortener check-types
pnpm --filter shortener test
pnpm --filter shortener cf-typegen
pnpm --filter shortener dev
```

## Verification flow

1. Generate types after changing `wrangler.jsonc` with `pnpm --filter shortener cf-typegen`.
2. Start the Worker locally with `pnpm --filter shortener dev`.
3. Seed a local slug with the same `wrangler kv key put` command, but replace `--remote` with `--local`.
4. Confirm `http://127.0.0.1:8787/health` returns `200`.
5. Confirm `http://127.0.0.1:8787/daybreak?utm_source=instagram` returns a `302` to the canonical `vesta.cx` URL with the query string preserved.
