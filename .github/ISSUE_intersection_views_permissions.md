# Add intersection views (permissions × object tables) for list queries

## Summary

Introduce **named SQL views** that express the intersection of the `permissions` table with each permission-scoped object type. These views allow list endpoints to "only rows this subject can read" by joining the object table to the view and filtering by subject, then composing with `@mia-cx/drizzle-query-factory` (e.g. `baseWhere` + parsed filters, sort, limit).

SQLite/D1 do not support materialized views; these will be **virtual views** (stored query, no extra storage). Performance relies on indexes on `permissions` and the object tables; the view itself has negligible overhead.

## Object types to cover

From `packages/db` schema, `permissions.object_type` can be:

- **Permissions × collections** — view for `collections:read` (and write/delete as needed)
- **Permissions × resources** — view for `resources:read` (and write/delete as needed)
- **Permissions × workspaces** — view for `workspaces:read` (and write/delete as needed)
- **Permissions × organizations** — view for `organizations:read` (and write/delete as needed)

Each view should expose the object id (and optionally subject_type, subject_id) so app code can `WHERE subject_id = :userId` and join back to the main table for full rows + ordering (e.g. `resources.updated_at DESC`).

## Implementation notes

- **View shape:** e.g. `(resource_id, subject_type, subject_id)` from `permissions` where `object_type`, `action`, `value = 'allow'`; then list query does `FROM resources r INNER JOIN view v ON v.resource_id = r.id WHERE v.subject_id = ? ORDER BY r.updated_at LIMIT ?`.
- **Query Factory:** Use `baseWhere` to restrict to "id IN (SELECT object_id FROM view WHERE subject_* = ?)" or equivalent; `parseListQuery` adds extra filters, sort, limit, offset.
- **Indexes:** Ensure `permissions` has indexes that support the join (subject + object_type + action + value; object_type + object_id).

## Scope

- [ ] Define views (migrations) for: collections, resources, workspaces, organizations
- [ ] Document pattern in `packages/db` or `apps/erato` (where list routes live)
- [ ] Wire list endpoints to use view-backed `baseWhere` where applicable
- [ ] No materialized cache table (out of scope for now; revisit if needed)

## References

- Permission schema: `packages/db/src/schema/permissions.ts` (`OBJECT_TYPES`, indexes)
- Query Factory: `runListQuery` composes `baseWhere` with `query.where` from `parseListQuery`
- Erato list routes (resources, workspaces, collections, etc.) as consumers
