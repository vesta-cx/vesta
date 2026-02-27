---
title: Development Checklist (Phase 1)
description: PR guidelines and pre-commit checks for vesta development
---

# Development Checklist (Phase 1)

Before submitting a PR, verify all items below pass. These checks ensure consistency, prevent rework, and keep the codebase maintainable.

## Scope & Design

- [ ] **Feature is Phase 1 scope.** Check [Milestone 1 scope](./milestones.md#milestone-1-scope). If not, open a backlog issue and defer.
- [ ] **Pricing tier assigned.** See [Feature tiers](./milestones.md#feature-tiers-pricing--gating). Document in PR or code comments.
- [ ] **No duplicate work.** Did you check [sona](../../apps/sona/) for existing patterns (D1 setup, R2 storage, auth, cron)?

## Implementation

- [ ] **Using `@vesta-cx/ui` components.** Import shadcn-svelte, Bits-UI, design tokens from the UI package. Do not rebuild locally.
- [ ] **Using `@vesta-cx/utils` for auth/storage.** Use shared WorkOS, R2, and type helpers. Do not reimplement.
- [ ] **Using `@vesta-cx/config` for tooling.** ESLint, Prettier, TypeScript, lint-staged configs from shared package.
- [ ] **Database schema uses Drizzle ORM.** If adding schema, use `packages/db` and Drizzle. Never raw SQL.
- [ ] **Server-only env vars use `PRIVATE_` prefix.** E.g., `PRIVATE_DATABASE_URL`, not `PUBLIC_DATABASE_URL`.

### Before You Rebuild

**Did you check `apps/sona` for reference patterns?**

- D1 database setup + migrations (Drizzle ORM)
- R2 storage (file uploads, streaming)
- WorkOS authentication + session management
- Cloudflare Workers routing
- Cron jobs / scheduled tasks
- Streaming audio files (R2 → browser)

Copy patterns from sona; don't rebuild from scratch. If you find a gap, note it and pair with sona developers.

## Quality & Completeness

- [ ] **Tests pass.** Run `pnpm test` in the vesta workspace. All tests green.
- [ ] **Linting passes.** Run `pnpm lint`. No errors or unresolved warnings.
- [ ] **App builds & runs.** Verify `pnpm build` succeeds and `pnpm dev` runs without errors.
- [ ] **Commit message follows conventional commits.** E.g., `feat(vesta): add profile customization` or `fix(vesta): correct smart link logic`.

## Documentation

- [ ] **If schema changed:** Updated docs in `apps/docs/content/packages/db/model/`.
- [ ] **If feature affects users:** Added user-facing docs or help text in the app.
- [ ] **If new pattern emerges:** Consider documenting as a `.cursor/rules/` or `.cursor/skills/` file for future agents.

## Examples

**Good PR:** `feat(vesta): add post creation form` — uses `@vesta-cx/ui` Button, Input, Form components; stores post in D1 via Drizzle; assigns to Free tier; tests pass; docs updated.

**Needs rework:** Implements smart link redirect without checking if pattern exists in sona; uses inline CSS instead of Tailwind; missing tests; commit message is "fix stuff".

## See Also

- [Milestone 1 Roadmap (Blogging + Smart Links)](./milestones.md) — Feature scope and pricing tiers
- [README](../../../../README.md) — vesta vision and architecture
- [Erato](../../apps/erato/index.md) — Data model docs
