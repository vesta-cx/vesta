<!-- @format -->

# TODO

- **Move `drizzle-query-factory` docs to `mia-cx/docs`** — The detailed
  package documentation currently lives in `apps/docs/content/packages/drizzle-query-factory/`.
  Since `@mia-cx/drizzle-query-factory` is a standalone `@mia-cx` package, these
  docs should be migrated to the `mia-cx/docs` Quartz instance once that repo is
  set up.

- **Revisit changesets and package versioning** — After the Erato full CRUD API
  plan is done, decide how to use the repo’s existing `@changesets/cli` for
  `@mia-cx/drizzle-query-factory` (and other publishable packages): cut a
  changeset, then publish; or document another flow (e.g. manual npm publish, CI
  on tag).
