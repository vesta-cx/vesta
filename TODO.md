<!-- @format -->

# TODO

- [ ] **Flatten git tree** (#55) — Flatten submodules into the monorepo with `git subtree add` (deinit/remove each submodule first, then subtree add per repo) so full history lives in the monorepo. Optionally use `.gittrees` + push script to push subtrees back to separate remotes.

---

Epics and their sub-issues in priority order. Tackle epics top to bottom; within each epic, sub-issues are ordered.

## Epics (in priority order)

1. **#36** Epic: Infrastructure & tooling improvements  
   - #55 → #56 → #57 → #58 *(#55 Flatten git tree is first on the docket.)*

2. **#32** Epic: Database schema modernization & performance  
   - #38 → #39 → #40 → #41 → #42 → #43 → #44 → #45

3. **#33** Epic: Test coverage & quality gates  
   - #46 → #47 → #48

4. **#34** Epic: Comments & threading model migration  
   - #49 → #50

5. **#35** Epic: Documentation consolidation & accuracy  
   - #51 → #52 → #53 → #54

6. **#37** Epic: Erato API foundation  
   - #59 → #60 → #61 → #62 → #63 → #64 → #65 → #66 → #67

---

## Task list (detailed)

- [ ] **Move `drizzle-query-factory` docs to `mia-cx/docs`** (#54) — The detailed package documentation currently lives in `apps/docs/content/packages/drizzle-query-factory/`. Since `@mia-cx/drizzle-query-factory` is a standalone `@mia-cx` package, these docs should be migrated to the `mia-cx/docs` Quartz instance once that repo is set up.

- [ ] **Revisit changesets and package versioning** (#56) — After the Erato full CRUD API plan is done, decide how to use the repo’s existing `@changesets/cli` for `@mia-cx/drizzle-query-factory` (and other publishable packages): cut a changeset, then publish; or document another flow (e.g. manual npm publish, CI on tag).

- [ ] **Extract git shell helpers into publishable package** (#57) — Move the custom git aliases/functions from `~/.zshrc` (e.g. `gs`, `gpl`, `gsma`, `gcl`, `gsmrm`) into a dedicated `@mia-cx/` scoped repo/package so it can be versioned and reused across machines/projects.

- [ ] **Adopt `runListQuery` in medium/high-complexity Erato list routes** — Deferred to pre-v1 staging (no GitHub issue). These routes have extra logic (owner-scope joins, workspace membership checks, multi-table joins) that may benefit from the helper but need careful review:
  - Medium: `users/list.ts`, `workspaces/list.ts`, `collections/list.ts`, `teams/members/list.ts`, `collections/filters/list.ts`
  - High: `resources/list.ts`

- [ ] **Explore multi-facet resources model** — Explore only (no GitHub issue). Keep one `resources.type` for now, but revisit a future design where one resource can expose multiple facets/types (e.g. post + song + status) without duplicating core identity fields.

- [ ] **Worker perf backlog (erato/sona/web)** (#58) — Track non-Node optimizations for Cloudflare Worker apps: reduce cold-path initialization, trim bundle/module graph, add D1 index/query review pass, and define caching strategy per hot route. Explicitly exclude Node pointer-compression work for Worker runtimes.

- [ ] **Replace custom apiKeys in KV with WorkOS FGA** (#69) — WorkOS now offers Fine-Grained Authorization (FGA) for hierarchical, resource-scoped access control. Replace our current custom API key approach stored in KV with WorkOS's Authorization API. Enables automatic permission inheritance down resource hierarchy (org → workspace → project → app), real-time checks (<50ms p95), and IdP role mapping. Can adopt incrementally—no data migration required. See [WorkOS FGA docs](https://workos.com/docs/fga).
