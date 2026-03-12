# Quality Survey

An A/B audio comparison survey app to determine which audio codecs and bitrates sound best. Built with SvelteKit, hosted on Cloudflare Workers.

## Architecture

- **SvelteKit** on **Cloudflare Workers** via `@sveltejs/adapter-cloudflare`
- **Cloudflare D1** (SQLite) for database, **Drizzle ORM** for queries
- **Cloudflare R2** for audio file storage
- **WorkOS AuthKit** for admin authentication via `@vesta-cx/utils/auth` (shared, hook-based)
- **Bradley-Terry model** for statistical codec ranking
- **Cron Trigger** (every 15 min) for aggregated result snapshots

## Development

```bash
# From monorepo root
pnpm install

# Dev server (uses getPlatformProxy for local D1/R2 emulation)
pnpm --filter quality-survey dev

# Generate Drizzle migrations
pnpm --filter quality-survey db:generate

# Apply migrations (Wrangler D1; drizzle-kit migrate doesn't work with D1)
pnpm --filter quality-survey db:migrate:local   # local D1
pnpm --filter quality-survey db:migrate       # remote D1

# Run tests
pnpm --filter quality-survey test

# Deploy
pnpm --filter quality-survey deploy
```

## Environment

Secrets in `.dev.vars` (local) / Cloudflare dashboard (production):

- `PRIVATE_WORKOS_CLIENT_ID` — WorkOS client ID
- `PRIVATE_WORKOS_API_KEY` — WorkOS API key
- `PRIVATE_WORKOS_ORG_ID` — WorkOS organization ID (vesta org)
- `PRIVATE_WORKOS_COOKIE_PASSWORD` — 32+ char secret for encrypting session cookies (`openssl rand -base64 24`)

Bindings in `wrangler.jsonc`:

- `DB` — D1 database
- `AUDIO_BUCKET` — R2 bucket for audio files

### Wrangler environments (dev vs production)

The config defines two environments so dev and production use separate D1 and R2 instances (no orphan objects).

- **Default** — Production: `vesta-sona-db`, `vesta-sona-audio`
- **`dev`** — Development: `vesta-sona-db-dev`, `vesta-sona-audio-dev`

To bootstrap the dev env:

```bash
# Create dev D1 database (then set database_id in wrangler.jsonc env.dev.d1_databases)
pnpm wrangler d1 create vesta-sona-db-dev

# Create vesta-sona-audio-dev bucket in Cloudflare dashboard, or via R2 API

# Apply migrations to dev D1
pnpm db:migrate:dev
```

Commands: `pnpm preview:dev` (wrangler dev with dev env), `pnpm deploy:dev` (deploy to dev worker).

### Cron trigger (snapshot every 6 hours)

A custom `worker.ts` entry wraps the SvelteKit output and adds a `scheduled` handler for the cron trigger. Snapshots run at 0:00, 6:00, 12:00, 18:00 UTC.

To test locally:

```bash
pnpm preview -- --test-scheduled
# Then: curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

## Routes

| Route                    | Description                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `/`                      | Home page with hero + data visualizations                                               |
| `/survey/setup`          | Device onboarding                                                                       |
| `/survey/play`           | A/B comparison game                                                                     |
| `/api/stream/[token]`    | Ephemeral audio stream                                                                  |
| `/api/answers`           | Submit comparison answer                                                                |
| `/api/stats`             | Latest result snapshot                                                                  |
| `/auth/login`            | WorkOS AuthKit login redirect                                                           |
| `/auth/callback`         | OAuth callback handler                                                                  |
| `/auth/logout`           | Clear session and redirect to login                                                     |
| `/admin`                 | Admin dashboard (protected)                                                             |
| `/admin/devices`         | Manage listening devices                                                                |
| `/admin/sources`         | Upload and manage source audio                                                          |
| `/admin/quality-options` | Toggle codec+bitrate permutations                                                       |
| `/admin/pairing-weights` | Pairing weights, placebo rate, permutation/transition/mode weights, Tradeoff gap config |
| `/admin/snapshots`       | View/trigger result snapshots                                                           |

## Visualizations

Each chart is a dedicated Svelte component in `src/lib/components/`:

- **Overall stats** — Total responses, sessions, neither rate, avg response time
- **Codec win rate bar chart** — Per-codec win rates and comparison counts
- **Bitrate tier chart** — Win rates by tier (lossless, high, mid, low)
- **Device distribution** — Headphones vs speakers, price tier breakdown
- **Headline matchups** — Lossless vs lossy, Opus vs MP3, AAC vs MP3
- **Codec matchup heatmap** — Codec×bitrate win rates (e.g. Opus vs MP3)
- **Codec equivalence chart** — Cross-codec bitrate equivalence ratios
- **PQ line chart** — Perceptual quality curves (Bradley-Terry derived)
- **FLAC vs lossy chart** — Transparency by codec and bitrate
- **Neither by bitrate diff** — Uncertainty vs bitrate gap (scatter/stacked)
- **Genre visualizations** (when `codecPqScoresByGenre` exists): confidence band, spaghetti plot, genre×config heatmap

Data comes from `result_snapshots` (scalar columns + JSON blobs). Page falls back to legacy `insights` when scalars are missing. Snapshot stats include sourceset counts, per-mode metrics (rounds, win rate, neither rate, avg response time), top genres/artists/songs/codecs, and source coverage.

## Database Schema

7 tables: `listening_devices`, `source_files`, `quality_options`, `candidate_files`, `ephemeral_stream_urls`, `answers`, `result_snapshots`. See `src/lib/server/db/schema.ts`.

## Seeding Quality Options

Use the admin panel at `/admin/quality-options` and click "Seed Defaults" to populate the standard codec+bitrate matrix (flac/0, opus/mp3/aac at 320-32 kbps).

## Uploading Audio

Use the admin sources page at `/admin/sources` to upload lossless audio (FLAC, WAV, AIFF, ALAC). Each file is sent to **Euterpe** for transcoding to FLAC, Opus@128, and Opus@96. Sources are created immediately with metadata; `r2_key` and duration are filled when the webhook fires after transcoding. Multi-file and recursive folder upload are supported. Metadata (title, artist, remixer, genre, license URL, stream URL) is auto-extracted from file tags where available.

## Todos

- [ ] Add cover art to survey game (optional future enhancement)
