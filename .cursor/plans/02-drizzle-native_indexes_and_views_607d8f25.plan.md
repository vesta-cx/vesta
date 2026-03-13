---
name: Drizzle-Native Indexes and Views
overview: Phase-1 indexes are already in schema; add selected v0 read views in Drizzle so future generated migrations include them automatically.
todos:
  - id: tests
    content: Build @vesta-cx/db and run apps/erato tests after view schema and migration updates
    status: completed
  - id: rules-skills
    content: "Rules & skills: N/A unless a repeatable Drizzle view/index workflow emerges during implementation"
    status: completed
  - id: docs
    content: N/A for this pass unless migration/schema behavior changes API docs expectations
    status: completed
  - id: review-close
    content: Review generated migration for duplicates/drift and validate view coverage (all four views present)
    status: completed
isProject: false
---

<!-- @format -->

# Drizzle-Native Indexes and Views

## What will be implemented (#40, #41)

- Phase-1 indexes are already present in schema (see [Indexes already in schema](#indexes-already-in-schema) below). No index changes in this pass; this plan only implements view work and migration generation/validation.
- Add selected SQL views in Drizzle schema. SQLite views support **filtering (WHERE)** in the view definition; only **ordering (ORDER BY)** is applied at query time. So filtered public\_\* views are valid and useful.
- Views to add:
  - `public_resources_v0`
  - `public_collections_v0`
  - `public_workspaces_v0`
  - `engagement_timeline_v0`
- Ensure views are declared in schema source so `drizzle-kit generate` can emit them.

## Indexes already in schema

Existing `index(...)` declarations (no changes needed):

| File | Index names |
| --- | --- |
| resources.ts | `resources_owner_idx` |
| collections.ts | `collections_owner_idx`, `collections_owner_type_kind_idx`; collection_items: `collection_items_collection_position_idx` |
| workspaces.ts | `workspaces_owner_idx`, `workspaces_status_idx` |
| engagements.ts | `engagements_subject_idx`, `engagements_object_idx`, `engagements_subject_created_idx` |
| permissions.ts | `permissions_subject_lookup_idx`, `permissions_object_lookup_idx`, `permissions_action_lookup_idx` |
| users.ts | none |
| teams.ts | none |
| external-links.ts | composite PK only (no extra index; sufficient) |

## View declarations (#40)

- Add a new view schema module (or extend existing schema modules) using Drizzle SQLite view APIs, defining:
  - `public_resources_v0` — filter: `resources.status = 'LISTED'`
  - `public_collections_v0` — filter: `collections.status = 'LISTED'`
  - `public_workspaces_v0` — filter: `workspaces.status = 'LISTED'`
  - `engagement_timeline_v0` — columns from [packages/db/src/schema/engagements.ts](packages/db/src/schema/engagements.ts): `id`, `subjectType`, `subjectId`, `action`, `objectType`, `objectId`, `createdAt`. No filter; ordering by `createdAt` desc at query time for timeline/feeds.
- Export views from [packages/db/src/schema/index.ts](packages/db/src/schema/index.ts).

## Migration alignment (#41)

- Run Drizzle generation via Erato config ([apps/erato/drizzle.config.ts](apps/erato/drizzle.config.ts)).
- Avoid duplicate DDL in generated migration; keep migration ordering clean in [packages/db/drizzle](packages/db/drizzle).

## Validation

- Build DB package: `pnpm --filter @vesta-cx/db build`.
- Run Erato tests: `pnpm test` in `apps/erato`.

## Expected outcome

- Phase-1 indexes remain schema-first (already in place). Four views are schema-first in Drizzle code.
- Future migration generation includes these view objects without manual SQL drift.
