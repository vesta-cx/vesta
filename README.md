<!-- @format -->

# vesta

**vesta** is an all-in-one platform helping independent musicians, small labels,
and creative publishers manage their catalog, build their brand, and reach their
audience.

## Vision

vesta solves the fragmentation problem facing indie creators. Instead of
maintaining profiles across 10+ platforms, writing metadata into spreadsheets,
and paying $20–100/month for features they don't use, creators get one platform
that handles discovery (smart links), identity (customizable pages), community
(feeds, collections), and eventually streaming and commerce.

We start with the problems that hurt most: **conversion** (smart links to reduce
friction) and **identity** (beautiful, customizable pages). From there, we
expand into the full suite.

### Target Audience

**Primary:** Independent musicians, small labels, and music collectives—people
with limited budgets, limited time, but unlimited creativity.

**Secondary:** Curators and listeners—for the platform to matter, people need a
reason to visit and engage with content.

**Aspirational:** As vesta matures, we expand to other media (visual art,
literature, film) and grow into a full industry-grade tool suite that keeps
creators on the platform as they scale.

## The Problems We're Solving

1. **Conversion friction** — Artists share links, fans click, but without a
   smart link they have to manually search for the song on their streaming
   platform. Many give up. Smart links cut that friction to zero.
2. **Identity** — Existing platforms look the same. vesta lets creators
   customize every aspect of their page: colors, fonts, layout, theme. Your page
   should feel like your home.
3. **Decentralization overhead** — Creators maintain profiles on Spotify,
   SoundCloud, Instagram, TikTok, YouTube, Bandcamp, etc. Managing metadata
   across all of them is a full-time job. vesta centralizes this.
4. **Data quality** — Labels organizing compilations have to track artist names,
   metadata, legal info, royalty splits in spreadsheets. There's no better tool.
5. **Collaboration** — Tools like Splice Studio (discontinued) let musicians
   collaborate on projects with version control. This space is empty and sorely
   missed.

## Roadmap (Phase-Driven)

vesta reaches market through disciplined phases. Each phase is self-contained
and valuable on its own.

### Phase 1: Blogging Engine + Smart Links (NOW)

**Goal:** Get creators using vesta to announce releases and let fans find music
with zero friction.

**Features:**

- Artist/label profiles (customizable appearance)
- Post-based blogging engine (updates, release announcements)
- Smart links (links to Spotify, Apple Music, SoundCloud, YouTube, Bandcamp,
  etc.)
- User engagement (like, comment, repost, subscribe on posts)
- Collections (curated lists of posts that other users can follow)
- Free tier + modular pricing (see below)

**Why this first:** Conversion is the #1 friction point. Once creators see this
working, they adopt the platform. No technology blocker (we reuse patterns from
`apps/sona`).

### Phase 2: Pre-Save & DSP Announcements

**Goal:** Creators announce upcoming releases; fans pre-save them with one
click.

**Features:**

- Pre-save links (direct to DSPs)
- "Future pre-save" (fans pre-save all releases without pre-saving each one)
- Scheduled pages (pages go live at a specific time)

**Why this phase:** Completes the "announcement" story. Creators get real
conversion data.

### Phase 3: Analytics + Ad Platform Integration

**Goal:** Creators track which links drive traffic and revenue; they set up
retargeting campaigns.

**Features:**

- Basic analytics dashboard (link clicks, geography, time of day)
- Export to Meta Ads, TikTok Ads, Google Analytics (for retargeting)
- Conversion tracking (tie ad spend to link clicks)

**Why this phase:** Data-driven creators will pay for this. Provides feedback
loop for future development. After Phase 3 is stable, vesta becomes
self-sustaining.

### Phase 4: Public Sign-Up & Network Effects

**Goal:** Open the platform publicly. Introduce feed, follows, and community
features.

**Features:**

- Public sign-up (no invite required)
- Network (follow creators, curators, labels; see posts in feed)
- Collections (follow curators; their collections appear in your feed)
- Trending/discovery (algorithmic or curated)

**Why this phase:** We've proven the core product. The network becomes the moat.

### Phase 5+: Consolidation & Adjacent Features

Once self-sustaining, decide based on user feedback and runway:

- **Custom domains** — Let labels/artists use their own domain (vesta.io
  handling DNS)
- **Streaming** — Embed playable audio; eventually full music streaming
- **Merch & Commerce** — Integrate Shopify (or Stripe) for selling merch, vinyl,
  digital downloads
- **Advanced DQM** — Tools for managing metadata, royalty splits, compilations
  at scale
- **Collaboration** — Version control for music projects (long-term vision)

---

## Technology Stack

**vesta is built on existing foundations in this monorepo.** Don't reinvent.

| Layer                 | Technology                      | Why                                         |
| --------------------- | ------------------------------- | ------------------------------------------- |
| **Frontend**          | SvelteKit 5                     | Fast, reactive, server-first architecture   |
| **Styling**           | TailwindCSS v4 + OKLCH tokens   | Utility-first, design-system ready          |
| **Components**        | shadcn-svelte + Bits-UI         | Accessible, headless, customizable          |
| **Hosting & Compute** | Cloudflare Workers              | Fast cold starts, zero ops, great DX        |
| **Database**          | D1 (SQLite on CF) + Drizzle ORM | Schema-first, type-safe, migration-friendly |
| **Storage**           | R2 (Cloudflare S3-compatible)   | Audio files, cover art, user uploads        |
| **Auth**              | WorkOS (or other OIDC provider) | OAuth, SSO, zero custom auth logic          |
| **State**             | nanostores                      | Lightweight, reactive, no boilerplate       |

**Reference app:** `apps/sona` is your playbook. It uses all of these
technologies in production. Copy patterns, don't rebuild.

---

## Architecture: Apps & Packages

### Shared Packages (Don't Duplicate)

All vesta apps must use these packages. **No local component libraries. No local
utilities.**

#### `packages/ui` (`@vesta-cx/ui`)

- shadcn-svelte components (Button, Input, Card, Dialog, Popover, etc.)
- Bits-UI primitives (Tabs, Combobox, Tooltip, Pagination)
- Design tokens (OKLCH colors, spacing, typography via TailwindCSS)
- Utility components (layout, forms, charts)

**Usage:** Import components from `@vesta-cx/ui` in all apps. Build on top;
don't duplicate.

#### `packages/utils` (`@vesta-cx/utils`)

- Auth helpers (session management, OAuth flow, WorkOS integration)
- Storage providers (R2StorageProvider, local dev storage)
- Type definitions (shared across apps)
- Utility functions (date, string, number helpers)

**Plan:** As vesta-specific patterns emerge (feature gating, pricing tier
checks, creator analytics), extend this package. Keep app-specific logic in the
app; keep shared logic here.

#### `packages/config`

- ESLint, Prettier, TypeScript, lint-staged configs

**Usage:** Reference in all app `package.json` files.

### Vesta Apps (Build These)

#### `apps/vesta` (Main Public App)

- **Purpose:** Creator profiles, blogging, smart links, community feeds
- **Routes:**
  - `/` — Logged-out landing page + sign-up
  - `/@[creator]` — Creator profile (public, customizable)
  - `/@[creator]/posts` — Creator's post feed (public)
  - `/dashboard` — Creator dashboard (logged-in)
  - `/dashboard/profile` — Edit profile, customize appearance
  - `/dashboard/posts` — Manage posts
  - `/dashboard/links` — Manage smart links
  - `/[smart-link-slug]` — Public smart link (redirect logic)
  - `/admin` — (Future) Admin dashboard
- **Database:** D1, schema in Drizzle (creators, posts, links, engagement)
- **Storage:** R2 for cover art, profile images
- **Auth:** WorkOS via `@vesta-cx/utils`

#### `apps/vesta-admin` (Creator Dashboard, separated if needed)

- **Purpose:** Advanced tooling (analytics, link management, bulk operations)
- **Future scope:** After Phase 3 (analytics) is built in main app, might
  extract to separate app for perf
- **For now:** Keep in `apps/vesta`; separate only if needed

#### `apps/vesta-api` (Backend APIs, if needed)

- **Purpose:** GraphQL or REST endpoints for mobile apps, third-party
  integrations
- **For now:** Implement via SvelteKit `+server.ts` routes in `apps/vesta`;
  extract to separate app only if load demands it

### Reference Apps (Don't Copy, Understand)

#### `apps/sona` (Quality Survey App)

- Demonstrates Cloudflare + SvelteKit patterns
- Shows D1 migrations, R2 usage, cron jobs, streaming
- Shows authentication (WorkOS), session management
- Study this. Reuse these patterns in `apps/vesta`.

#### `apps/euterpe` (Audio Transcoding Microservice)

- Currently transcodes audio for `apps/sona`
- Future: May extend to support vesta's needs (transcode user uploads)
- For now: Reference only

---

## Modular Pricing Model

vesta's core value: **creators only pay for features they need.**

### How It Works

Each feature has:

1. **Cost of Operation** — What it costs to run and support (e.g., R2 storage,
   database compute, Stripe fees)
2. **Base Price** — A fair, competitive price above that cost (e.g., $5/month
   for a feature costing $0.50/month to operate)
3. **Discount Curve** — As creators add more features, the total plan price
   approaches the midpoint between base price and operational cost

### Example

If a creator uses:

- Smart links (trial, $0)
- Custom domain ($5/month base)
- Basic analytics ($10/month base)

Instead of $15/month, they get a discount: maybe $12/month. More features =
bigger discount, up to a cap.

### Trial Features (No Payment)

Features with negligible operational cost are always free:

- Profiles, posts, smart links (tier 1)
- Basic collections
- User engagement (like, comment, repost)

### Paid Features (After Trial)

- Custom domains
- Advanced analytics (geography, device, conversion tracking)
- Ad platform integrations (Meta, TikTok, Google Analytics)
- High storage tier (generous limits then per-GB charges)
- Collaboration tools (team accounts)

### Implication for Development

**Every feature must have an assigned tier (trial, basic, pro, enterprise).**
This informs feature gating logic and helps prioritize what to build.

---

## Development Conventions

### Getting Started

```bash
# Install dependencies
pnpm install

# Start all apps and packages in dev mode
pnpm dev

# Or, target a specific app
pnpm --filter vesta dev
pnpm --filter @vesta-cx/ui dev
```

### SvelteKit + Cloudflare

All vesta apps use `@sveltejs/adapter-cloudflare`:

```javascript
// svelte.config.js
export default {
  kit: {
    adapter: cloudflare({ platformProxy: true }),
  },
};
```

**Environment variables:** Use `PRIVATE_` prefix for server-only secrets:

```javascript
// svelte.config.js
export default {
  kit: {
    env: {
      privatePrefix: "PRIVATE_",
    },
  },
};
```

Then in `.dev.vars` (local) or Cloudflare dashboard (production):

```
PRIVATE_WORKOS_API_KEY=...
PRIVATE_DATABASE_URL=...
```

### Database Setup

Use **Drizzle ORM** for all schema management:

```bash
# Generate migrations
pnpm --filter vesta db:generate

# Apply to local D1
pnpm --filter vesta db:migrate:local

# Apply to production D1
pnpm --filter vesta db:migrate
```

### Styling

- **Use Tailwind only.** No `<style>` blocks or inline CSS.
- **Design tokens in OKLCH color space** (e.g., `oklch(0.141 0.005 285.823)`),
  not hex or HSL
- **Import from `@vesta-cx/ui`** — reuse components, don't rebuild

### Component Development

If you build a component that's reusable across vesta apps or the wider
ecosystem:

1. Add it to `packages/ui/src/components/`
2. Export from `packages/ui/src/index.js`
3. Rebuild the package: `pnpm --filter @vesta-cx/ui build`
4. Import in your app: `import { MyComponent } from '@vesta-cx/ui'`

### Testing

- **Unit tests** with Vitest: `pnpm test:unit`
- **E2E tests** with Playwright: `pnpm test:e2e`
- Write tests alongside implementation, not after

### Deployment

```bash
# Deploy to Cloudflare (production)
pnpm --filter vesta deploy

# Deploy to dev environment (if configured)
pnpm --filter vesta deploy:dev
```

---

## Architecture Decisions

### Why SvelteKit + Cloudflare?

- **SvelteKit:** Minimal abstraction, reactive, server-first, ships less
  JavaScript
- **Cloudflare:** Zero cold starts, great perf globally, built-in primitives
  (D1, R2, KV), no ops burden

### Why Drizzle ORM?

- Schema-first: define tables in TypeScript, get migrations for free
- Type-safe queries: catch errors at compile time
- Works with D1, Postgres, MySQL

### Why Modular Packages?

- **Single source of truth** for components, auth, utilities
- **Easy to publish** to npm as `@vesta-cx/*` if needed for external teams
- **Forces good boundaries** between app logic and reusable logic

### Why Start with Blogging + Smart Links?

- Solves the #1 pain (conversion friction)
- Creators see immediate value
- No tech blocker (all patterns proven in `apps/sona`)
- Builds foundation for later features (feeds, collections, analytics)

---

## Workspace Structure

```
vesta-cx/vesta/
├── apps/
│   ├── docs/              (Quartz site, Obsidian vault)
│   ├── sona/              (Reference: quality survey app)
│   ├── euterpe/           (Reference: audio transcoding)
│   └── vesta/             (Main public app — Phase 1+)
├── packages/
│   ├── ui/                (shadcn-svelte, shared components)
│   ├── utils/             (Shared auth, storage, helpers)
│   └── config/            (ESLint, Prettier, TypeScript)
├── tools/
│   └── scripts/           (Utilities, CI helpers)
├── package.json           (Root, Turborepo config)
├── README.md              (This file)
└── .cursor/
    └── rules/             (Agent guidance for AI)
```

---

## Contributing

### Before Starting Work

1. **Check the current phase** (see Roadmap section above). Is your feature in
   scope?
2. **Check the rules** (`.cursor/rules/`) for project conventions and patterns.
3. **Reuse packages first:** Does `@vesta-cx/ui`, `@vesta-cx/utils`, or
   `apps/sona` already have what you need?

### Feature Work

1. Create a feature branch: `git checkout -b feat/your-feature`
2. Write tests alongside implementation (Vitest for units, Playwright for E2E)
3. Use conventional commits: `feat(vesta): add smart link management`
4. Push and open a PR

### Pull Requests

- Summarize what the PR does and why
- Link to related issues or roadmap items
- Ensure tests pass: `pnpm test`
- Ensure linting passes: `pnpm lint`

---

## FAQ

### Q: Where does [feature] belong? vesta app? vesta-admin? vesta-api?

**A:** For Phase 1–3, put everything in `apps/vesta`. Separate only if:

- The feature is accessed via a different domain (e.g., `admin.vesta.io`)
- You hit performance issues (monolithic app too slow)
- You need a different tech stack (e.g., API in a different language)

For now, SvelteKit `+server.ts` routes handle everything.

### Q: Should I use GraphQL or REST for the API?

**A:** REST for Phase 1. GraphQL when the data graph justifies it (Phase 3+,
when analytics queries get complex). Avoid premature complexity.

### Q: How do I add a new environment variable?

**A:** Add to `.dev.vars` (local) or Cloudflare dashboard (production). Use
`PRIVATE_` prefix for server-only vars. Reference via
`import { env } from '$env/static/private'` in `+server.ts` or load functions.

### Q: How do I seed the database locally?

**A:** Create a seed script in `src/lib/server/seed.ts`, then run:

```bash
pnpm wrangler d1 execute vesta-db-dev < seed.sql
```

Or use Drizzle's seeding: `pnpm drizzle-kit seed`

### Q: What if I need to run a one-off database query?

**A:** Use Wrangler's D1 shell:

```bash
pnpm wrangler d1 execute vesta-db-dev --file=query.sql
```

---

## Resources

- **SvelteKit Docs:** https://svelte.dev/docs/kit
- **Svelte 5 Docs:** https://svelte.dev/docs/svelte
- **Cloudflare Workers:** https://developers.cloudflare.com/workers/
- **Drizzle ORM:** https://orm.drizzle.team/docs/overview
- **Turborepo:** https://turbo.build/repo/docs
- **shadcn-svelte:** https://shadcn-svelte.com/docs
- **TailwindCSS:** https://tailwindcss.com/docs

---

**Last updated:** February 26, 2026

For the full vesta product vision, see the
[full project brief](https://docs.vesta.cx/Projects/vesta/).
