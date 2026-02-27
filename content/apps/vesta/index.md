---
title: vesta
description: Public-facing SvelteKit app for creators to build profiles, publish posts, and share smart links
---

# apps/vesta

`apps/vesta` is the primary public application for the vesta platform. It serves creators' profiles, posts, smart links, and early community features (likes, comments, reposts, collections).

## Purpose

**Phase 1 mission:** Get creators using vesta to announce releases and let fans find music with zero friction.

**Features in Phase 1:**

- Creator/label profiles (customizable appearance via theming)
- Post-based blogging engine (updates, release announcements)
- Smart links (redirect to Spotify, Apple Music, SoundCloud, YouTube, Bandcamp, etc.)
- User engagement (like, comment, repost, subscribe on posts)
- Collections (curated lists; users can follow collections)
- Free tier + modular pricing (basic auth, simple analytics)

**Out of scope (Phase 2+):**

- Pre-save, scheduled pages
- Advanced analytics, ad integrations
- Streaming, merch, commerce
- Collaboration tools

## Architecture

**Stack:**

- SvelteKit 5 on Cloudflare Workers
- `@sveltejs/adapter-cloudflare` (with `getPlatformProxy` for local D1)
- D1 binding (same database as Erato; see [erato](../erato))
- Drizzle ORM (schemas from `packages/db`)
- Components from `@vesta-cx/ui` (shadcn-svelte, Bits-UI, TailwindCSS)
- Auth via WorkOS (in `@vesta-cx/utils`)

## Database Access (Phase 1)

During Phase 1, `apps/vesta` accesses D1 directly:

```typescript
// src/routes/dashboard/+page.server.ts
import { db } from "@vesta-cx/db"
import { auth } from "@vesta-cx/utils"

export async function load({ locals, platform }) {
  const creator = await auth.getSession(locals)
  if (!creator) throw redirect(303, "/auth/login")

  const posts = await db.query.posts.findMany({
    where: (posts, { eq }) => eq(posts.creatorId, creator.id),
  })

  return { creator, posts }
}
```

### Phase 2: Erato API

When Erato becomes the authoritative API, routes swap to HTTP:

```typescript
// src/routes/dashboard/+page.server.ts
const res = await fetch("https://erato.vesta.io/api/creators/" + creator.id + "/posts")
const posts = await res.json()
```

## File Structure

```
apps/vesta/
├── src/
│   ├── routes/
│   │   ├── /                    # Landing page (logged out)
│   │   ├── /auth/login          # OAuth redirect (WorkOS)
│   │   ├── /auth/callback       # OAuth callback handler
│   │   ├── /auth/logout         # Clear session
│   │   ├── /@[creator]          # Creator profile (public)
│   │   │   └── +page.svelte      # Rendered profile
│   │   ├── /@[creator]/posts    # Creator's posts (public feed)
│   │   ├── /dashboard           # Creator dashboard (private)
│   │   │   ├── /profile         # Edit profile, customize theme
│   │   │   ├── /posts           # Manage posts
│   │   │   └── /links           # Manage smart links
│   │   ├── /[smart-link-slug]   # Smart link redirect
│   │   └── /api/*               # SvelteKit server routes
│   ├── lib/
│   │   ├── server/
│   │   │   ├── auth.ts          # Auth helpers (wrap WorkOS)
│   │   │   ├── db.ts            # D1 access layer
│   │   │   └── queries/         # Query builders (repositories)
│   │   ├── components/          # App-specific Svelte components
│   │   │   ├── CreatorProfile.svelte
│   │   │   ├── PostCard.svelte
│   │   │   ├── SmartLinkBuilder.svelte
│   │   │   └── ...
│   │   └── utils/               # Client-side helpers
│   └── app.html
├── wrangler.jsonc
├── svelte.config.js
├── package.json
└── README.md
```

## Environment Variables

**Local (.dev.vars):**

```
PRIVATE_WORKOS_CLIENT_ID=...
PRIVATE_WORKOS_API_KEY=...
PRIVATE_WORKOS_ORG_ID=...
PRIVATE_WORKOS_COOKIE_PASSWORD=... (32+ char secret)
```

**Cloudflare Dashboard (production):**

- Same secrets as above
- Set via Wrangler or dashboard UI

## Development

```bash
# Install & start dev server
pnpm install
pnpm --filter vesta dev

# Dev server uses getPlatformProxy() to emulate D1 locally
# Routes available at http://localhost:5173

# Run tests
pnpm --filter vesta test

# Deploy to production
pnpm --filter vesta deploy
```

## Key Design Decisions

1. **SvelteKit `+server.ts` for all API routes** (Phase 1) — Avoids separate Erato calls, zero latency
2. **Modular pricing** — Every feature is tagged (free, basic, pro, enterprise)
3. **Creator identity via theming** — CSS variables for colors, fonts, layout (future: full customization)
4. **Ephemeral URLs for smart links** — See [ephemeral-url-pattern](../ephemeral-url-pattern)
5. **Component reuse from `@vesta-cx/ui`** — No local UI library duplication

## Pricing & Feature Gates

**Free tier (always trial):**

- Profile, posts, smart links
- Basic collections
- User engagement (like, comment, repost)

**Basic tier (paid):**

- Custom domain
- Basic analytics

**Pro tier (paid):**

- Advanced analytics (geography, device, conversion)
- Ad integrations (Meta, TikTok, Google Analytics)

Implement feature gates early:

```typescript
// src/lib/server/queries/features.ts
export async function canUseAdvancedAnalytics(creatorId: string) {
  const plan = await db.query.subscriptions.findFirst({
    where: (subs, { eq }) => eq(subs.creatorId, creatorId),
  })
  return plan?.tier === "pro" || plan?.tier === "enterprise"
}
```

## See Also

- [erato](../erato) — Data layer & REST API
- [db](../db) — Shared database schemas
- [ui](../../../ui) — Component library
- [utils](../../../utils) — Shared auth, storage, helpers
