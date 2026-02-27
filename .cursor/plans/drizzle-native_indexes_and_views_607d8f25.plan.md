---
name: Drizzle-Native Indexes and Views
overview: Add phase-1 hot indexes plus selected v0 read views directly in Drizzle schema definitions so future generated migrations include them automatically.
todos:
  - id: tests
    content: Build @vesta-cx/db and run apps/erato tests after index/view schema and migration updates
    status: pending
  - id: rules-skills
    content: "Rules & skills: N/A unless a repeatable Drizzle view/index workflow emerges during implementation"
    status: pending
  - id: docs
    content: N/A for this pass unless migration/schema behavior changes API docs expectations
    status: pending
  - id: review-close
    content: Review generated migration for duplicates/drift, preserve external_links backfill, and validate index/view coverage
    status: pending
isProject: false
---

# Drizzle-Native Indexes and Views

## What will be implemented

- Add only phase-1 (currently planned) indexes to schema table definitions (no medium-priority expansion).
- Add selected SQL views in Drizzle schema:
  - `public_resources_v0`
  - `public_collections_v0`
  - `public_workspaces_v0`
  - `external_links_projection_v0`
  - `engagement_timeline_v0`
- Ensure both indexes and views are declared in schema source so `drizzle-kit generate` can emit them.

## Schema changes

- Update table schemas with `index(...)` declarations in:
  - [packages/db/src/schema/resources.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/resources.ts)
  - [packages/db/src/schema/permissions.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/permissions.ts)
  - [packages/db/src/schema/collections.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/collections.ts)
  - [packages/db/src/schema/workspaces.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/workspaces.ts)
  - [packages/db/src/schema/engagements.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/engagements.ts)
  - [packages/db/src/schema/users.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/users.ts)
  - [packages/db/src/schema/teams.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/teams.ts)
- Keep `external_links_subject_idx` declared in schema file for parity with current migration.

## View declarations

- Add a new view schema module (or extend existing schema modules) using Drizzle SQLite view APIs, defining:
  - `public_resources_v0` (`resources.status = 'LISTED'`)
  - `public_collections_v0` (`collections.visibility = 'public'`)
  - `public_workspaces_v0` (`workspaces.visibility = 'public'`)
  - `external_links_projection_v0` (projection over `external_links`)
  - `engagement_timeline_v0` (engagement read projection)
- Export views from [packages/db/src/schema/index.ts](/Users/mia/vesta-cx/vesta/packages/db/src/schema/index.ts).

## Migration alignment

- Run Drizzle generation via Erato config ([apps/erato/drizzle.config.ts](/Users/mia/vesta-cx/vesta/apps/erato/drizzle.config.ts)).
- Reconcile generated migration with existing manual `0002_external_links.sql`:
  - avoid duplicate DDL
  - preserve backfill logic for `external_links`
- Keep migration ordering clean in [packages/db/drizzle](/Users/mia/vesta-cx/vesta/packages/db/drizzle).

## Validation

- Build DB package: `pnpm --filter @vesta-cx/db build`.
- Run Erato tests: `pnpm test` in `apps/erato`.
- Regenerate scopes doc if route metadata changed (not expected for this pass).

## Expected outcome

- Indexes and views are schema-first in Drizzle code.
- Future migration generation includes these objects without manual SQL drift.

