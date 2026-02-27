<!-- @format -->

# TODO

- [ ] **Move `drizzle-query-factory` docs to `mia-cx/docs`** — The detailed package documentation currently lives in `apps/docs/content/packages/drizzle-query-factory/`. Since `@mia-cx/drizzle-query-factory` is a standalone `@mia-cx` package, these docs should be migrated to the `mia-cx/docs` Quartz instance once that repo is set up.

- [ ] **Revisit changesets and package versioning** — After the Erato full CRUD API plan is done, decide how to use the repo’s existing `@changesets/cli` for `@mia-cx/drizzle-query-factory` (and other publishable packages): cut a changeset, then publish; or document another flow (e.g. manual npm publish, CI on tag).

- [ ] **Extract git shell helpers into publishable package** — Move the custom git aliases/functions from `~/.zshrc` (e.g. `gs`, `gpl`, `gsma`, `gcl`, `gsmrm`) into a dedicated `@mia-cx/` scoped repo/package so it can be versioned and reused across machines/projects.

- [ ] **Adopt `runListQuery` in medium/high-complexity Erato list routes** — Deferred to pre-v1 staging. These routes have extra logic (owner-scope joins, workspace membership checks, multi-table joins) that may benefit from the helper but need careful review:
  - Medium: `users/list.ts`, `workspaces/list.ts`, `collections/list.ts`, `teams/members/list.ts`, `collections/filters/list.ts`
  - High: `resources/list.ts`

- [ ] **Explore multi-facet resources model** — Keep one `resources.type` for now, but revisit a future design where one resource can expose multiple facets/types (e.g. post + song + status) without duplicating core identity fields.

- [ ] **Worker perf backlog (erato/sona/web)** — Track non-Node optimizations for Cloudflare Worker apps: reduce cold-path initialization, trim bundle/module graph, add D1 index/query review pass, and define caching strategy per hot route. Explicitly exclude Node pointer-compression work for Worker runtimes.
