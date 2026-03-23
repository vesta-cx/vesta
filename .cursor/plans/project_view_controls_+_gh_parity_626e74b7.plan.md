---
name: project view controls + GH parity
overview: Fix non-clearable view/period controls on recap and project pages, eliminate project-page layout shift when switching views, and redesign the project surface to mirror GitHub Projects table/board UX (grouping, sorting, customizable field columns, board column controls). Workflows and roadmap/sprint views are out of scope.
todos:
  - id: schema
    content: "Add project_views and view_filters tables to packages/db schema. project_views: id, project_id FK, name, view_type ('table'|'board'), visible_fields (JSON text), position, is_default, created_by_user_id FK, created_at, updated_at. view_filters: id, view_id FK, kind ('filter'|'sort'|'group'), field, operator (nullable), value (nullable, JSON-encoded), direction ('asc'|'desc', nullable), position, created_at."
    status: completed
  - id: migrate
    content: Generate and apply Drizzle migration for the two new tables. Verify wrangler applies cleanly against the local D1 database.
    status: completed
  - id: views-api
    content: "Add API routes under /api/workspaces/:wsId/projects/:projId/views: GET (list views for project), POST (create view), PATCH /:viewId (update name/type/visible_fields), DELETE /:viewId. Add PUT /:viewId/filters to bulk-replace all filter rows for a view (simpler than individual add/delete for debounced sync). Auto-create a default table view on first GET if none exist."
    status: completed
  - id: page-load
    content: Load the active view (first is_default=1, else first by position) in +page.server.ts alongside tasks. Hydrate viewMode, visibleFields, and the active sort/group/filter into page local $state on mount.
    status: completed
  - id: shared-view-tabs
    content: Build a non-clearable ViewTabs primitive in packages/ui using a custom Svelte context (role=tablist/tab, aria-selected). The context holds the active value and a select() function that is a no-op when the item is already active — this prevents deselection. Do NOT use Bits UI Tabs.Root. Export Root and Item from index.ts.
    status: completed
  - id: rebuild-ui-1
    content: Rebuild @textile/ui immediately after shared-view-tabs so recap and project page changes can import the new primitive. Run pnpm --filter @textile/ui build.
    status: completed
  - id: recap-tabs
    content: Migrate recap period control to ViewTabs. Offset/reset logic and the nav arrows must remain intact.
    status: completed
  - id: project-header-tabs
    content: Replace the top-right icon ToggleGroup with ViewTabs (Table/Board) in a new second row. Add Sort, Group by, Fields controls. All controls read from and write to page-local $state (local-first). On any change debounce-sync to DB via PUT /:viewId/filters + PATCH /:viewId.
    status: completed
  - id: project-layout-stability
    content: Wrap both table and board content in a shared outer frame (min-h-[60vh] w-full) so switching views never reflows the page header or surrounding chrome.
    status: completed
  - id: project-table-parity
    content: "Add grouping (status or priority only), per-column sort controls, customizable field visibility, column action menus (Sort asc/desc, Hide field), and consistent row-level action menus. Archive is a valid row action: tasks.status is unconstrained text."
    status: completed
  - id: project-board-parity
    content: "Add column action menus. Rename column is UI-only: updates a page-local columnLabels $state map, no DB change. Group by priority changes column determination. Align board item actions with table row actions."
    status: completed
  - id: rebuild-ui-2
    content: Final @textile/ui rebuild after all shared component changes.
    status: completed
  - id: browser-verify
    content: "Verify in browser: view state persists across hard refresh; clicking active tab does nothing; no layout shift on view switch; sort/group/fields saved to DB; offline changes survive until reconnect."
    status: in_progress
isProject: false
---

<!-- @format -->

# Project View Controls + GitHub Projects UX Parity

## Problems being solved

1. **Deselectable toggles** — `ToggleGroup.Root type="single"` with `bind:value` uses Bits UI behavior that allows clicking the active item to clear the value to `undefined`. The app treats the value as always-set, so this breaks the rendered view silently.

2. **Project page layout shift** — Switching between kanban and table swaps two structurally different layout shells. Kanban uses `grid min-h-[60vh] grid-cols-3`; table uses a plain bordered `<table>` with no matching frame. Height, width distribution, and composer footprint all change at once.

3. **Weak project surface vs GitHub Projects** — View switching is a small icon toggle in the top-right corner. There are no grouping, sorting, or field customization controls. Board and table lack per-column/per-row action affordances.

## Out of scope

- Workflows
- Sprint / roadmap view
- Desktop (apps/app) parity — this plan targets web only
- Multiple user-created named views (only a single auto-created default view per project this phase; the schema supports N views for future)
- Filter conditions on `view_filters` (`kind='filter'`) — rows, schema, and API are included but the filter UI is a follow-up; this plan only writes `kind='sort'` and `kind='group'` rows

---

## 0. Data model

### `project_views` (1-M with `projects`)

```ts
// packages/db/src/schema/project-views.ts
export const projectViews = sqliteTable("project_views", {
  id: text("id").primaryKey(),
  projectId: text("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  viewType: text("view_type").notNull(), // 'table' | 'board'
  visibleFields: text("visible_fields"), // JSON: string[] — null means all default
  position: integer("position").notNull().default(0),
  isDefault: integer("is_default", { mode: "boolean" })
    .notNull()
    .default(false),
  createdByUserId: text("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

### `view_filters` (1-M with `project_views`)

```ts
// packages/db/src/schema/view-filters.ts
export const viewFilters = sqliteTable("view_filters", {
  id: text("id").primaryKey(),
  viewId: text("view_id")
    .notNull()
    .references(() => projectViews.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(), // 'filter' | 'sort' | 'group'
  field: text("field").notNull(), // e.g. 'status', 'priority', 'title', 'dueDate'
  operator: text("operator"), // 'eq' | 'neq' | 'in' — null for sort/group
  value: text("value"), // JSON-encoded — null for sort/group
  direction: text("direction"), // 'asc' | 'desc' — only for kind='sort'
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});
```

**Notes:**

- `kind='group'` rows use only `field` (e.g. `field='status'`); `operator`, `value`, `direction` are null
- `kind='sort'` rows use `field` and `direction`; `operator` and `value` are null
- `kind='filter'` rows are schema-complete but the filter UI is out of scope this phase — rows will not be written

### Auto-create default view

On `GET /api/.../views`, if no views exist for the project, the server creates one:

```json
{ "name": "Default", "viewType": "table", "isDefault": true, "position": 0 }
```

This ensures every project always has at least one view without a separate migration step.

### Sync strategy (local-first)

1. `+page.server.ts` loads the default view + its `view_filters` rows alongside tasks.
2. Page local `$state` is initialized from the loaded view on mount.
3. Every state change (viewType, groupBy, sortBy, visibleFields) immediately updates local `$state` (zero latency).
4. A 500 ms debounce fires `PATCH /:viewId` (for `viewType`, `visibleFields`) and `PUT /:viewId/filters` (bulk-replace sort+group rows) in parallel.
5. On offline/failure: the PATCH silently fails; local state survives navigation via SvelteKit page state; next successful load rehydrates from DB.

---

## 1. Shared non-clearable ViewTabs primitive

**Why a new primitive instead of patching ToggleGroup:** The deselectable behavior comes from the Bits UI `ToggleGroupItem` affordance itself. A custom context-based wrapper gives full control and cleaner semantics — tabs are inherently non-clearable — and a better visual pattern for GitHub-style view navigation.

**Implementation choice (locked):** Use a custom Svelte context. Do NOT use Bits UI `Tabs.Root`. The Bits UI Tabs primitive requires `Tabs.Content` for accessibility (aria-controls), which we can't provide since the "content" is the page itself. A custom implementation gives us full control over `role="tablist"`, `role="tab"`, `aria-selected`, and the no-op deselection rule without the `Tabs.Content` constraint.

Create `packages/ui/src/lib/components/ui/view-tabs/` with:

- `view-tabs.svelte` — `<div role="tablist">` wrapper; calls `setContext('viewTabs', { value, select })` where `select(v)` only fires if `v !== value`
- `view-tabs-item.svelte` — `<button role="tab" aria-selected tabindex="0">`; reads context via `getContext('viewTabs')` to derive `isActive`; `data-state="active|inactive"` for CSS styling
- `index.ts` — `export { default as Root } from './view-tabs.svelte'; export { default as Item } from './view-tabs-item.svelte';`

Key prop contract:

```typescript
// view-tabs.svelte
let {
  value = $bindable<string>(),
  onValueChange,
}: { value?: string; onValueChange?: (v: string) => void } = $props();

// view-tabs-item.svelte — icon prop accepts a Svelte Component
let {
  value,
  label,
  icon: Icon,
}: { value: string; label?: string; icon?: Component } = $props();
```

Active state flows via context. The item fires `onValueChange(value)` only when the item is not already active. Clicking the active tab is a no-op. This single rule fixes the deselection bug everywhere.

---

## 2. Recap period control migration

**Files:**

- [`apps/web/src/routes/app/recap/+page.svelte`](/Users/mia/mia-cx/textile-thesis/apps/web/src/routes/app/recap/+page.svelte)

**Current shape (lines 132–137):**

```svelte
<ToggleGroup.Root type="single" bind:value={period}>
  <ToggleGroup.Item value="daily">Daily</ToggleGroup.Item>
  <ToggleGroup.Item value="weekly">Weekly</ToggleGroup.Item>
  <ToggleGroup.Item value="monthly">Monthly</ToggleGroup.Item>
  <ToggleGroup.Item value="yearly">Yearly</ToggleGroup.Item>
</ToggleGroup.Root>
```

**Target shape:**

```svelte
<ViewTabs bind:value={period}>
  <ViewTabs.Item value="daily" label="Daily" />
  <ViewTabs.Item value="weekly" label="Weekly" />
  <ViewTabs.Item value="monthly" label="Monthly" />
  <ViewTabs.Item value="yearly" label="Yearly" />
</ViewTabs>
```

Period default stays `'daily'`. The `offset` reset `$effect` is unchanged. The tab strip lives in the same position as the current toggle group but now provides visual tab chrome, not segmented-button chrome.

---

## 3. Project header: tabs + controls row

**File:** [`apps/web/src/routes/app/w/[slug]/p/[projectSlug]/+page.svelte`](/Users/mia/mia-cx/textile-thesis/apps/web/src/routes/app/w/[slug]/p/[projectSlug]/+page.svelte)

**Current header (lines 333–359):** breadcrumbs + project name on the left, icon ToggleGroup on the right.

**Target layout:**

```
┌─────────────────────────────────────────────────────┐
│  ● color dot  Today / Workspace / Project name       │  ← row 1: unchanged (color picker strip collapses here)
├─────────────────────────────────────────────────────┤
│  [ Table ]  [ Board ]        [Sort] [Group] [Fields] │  ← row 2: ViewTabs left, controls right
├─────────────────────────────────────────────────────┤
│  (stable content frame)                              │
└─────────────────────────────────────────────────────┘
```

The color picker strip (`showColorPicker`) remains directly below row 1, exactly as it is today. No change to its placement.

**State (local-first — initialized from DB, synced back on change):**

```typescript
// hydrated from +page.server.ts load (activeView + its view_filters rows)
let viewMode     = $state<'table' | 'board'>(data.activeView.viewType);
let groupBy      = $state<'status' | 'priority' | 'none'>(/* from view_filters kind='group' */ 'status');
type SortField   = 'title' | 'status' | 'priority' | 'dueDate' | 'plannedDate';
let sortBy       = $state<{ field: SortField; dir: 'asc' | 'desc' } | null>(/* from view_filters kind='sort' */ null);
let visibleFields = $state<Set<string>>(/* from activeView.visibleFields JSON or default */ new Set([...]));

// debounced sync — fires 500 ms after last change
function syncViewToDb() { /* PATCH viewType+visibleFields, PUT filters */ }
```

Changes to `viewMode` trigger both local update and `PATCH /:viewId`. Changes to `groupBy`/`sortBy` trigger local update and `PUT /:viewId/filters`. Changes to `visibleFields` trigger `PATCH /:viewId`.

The new second row:

- Left: `ViewTabs` with `Table` and `Board` items (text + icon)
- Right: persistent controls — `Sort` dropdown, `Group by` dropdown (Status | Priority | None), `Fields` dropdown (column visibility toggles)
- All controls always visible; button variant shifts to `secondary` when a non-default value is active (e.g. sort applied)

---

## 4. Project layout stability

**Root cause:** the `{#if viewMode === 'kanban'}` block swaps two different outer containers. Fix: one stable outer frame, two inner slot renders.

```svelte
<!-- stable outer frame, same in both views -->
<div class="min-h-[60vh] w-full">
  {#if viewMode === 'table'}
    <!-- table markup inline -->
  {:else}
    <!-- board markup inline -->
  {/if}
</div>
```

Both views are kept inline in `+page.svelte` (no separate component files this phase). The add-task affordances remain inside each branch, but the outer frame is now stable so no header reflow occurs on switch.

---

## 5. Table view parity

Inspired by GitHub Projects table behavior observed in the browser audit.

**Grouping:**

- `Group by` dropdown: options are `Status` (default), `Priority`, `None` — **no Assignee**: `tasks.assigneeId` exists in the schema but the project page query does not join user display names, so assignee grouping is a follow-up
- When a group is active, rows are sectioned under collapsible group headers showing group name + item count
- Group headers have a chevron toggle (collapse/expand)

**Sorting:**

- Each column header gets a sort button (chevron up/down, toggles asc/desc, clicking unsorted column sorts asc)
- Active sort column is visually indicated in the header and in the `Sort` control-bar dropdown

**Field columns:**

- Default visible columns: Title, Status, Priority, Time Spent, Planned Date, Due Date
- `Fields` dropdown lists all available columns with checkboxes; toggling shows/hides that column
- Column order is fixed for now (drag-to-reorder is a follow-up)

**Column actions:**

- Each column header has a discrete `⋮` overflow button (shown on hover or always-visible for the active sort column)
- Menu options: Sort ascending, Sort descending, Hide field

**Row actions:**

- Each row has a `⋯` row-actions button shown on hover (consistent with existing task card actions)
- Actions: Start pomo, Mark done, Reopen, Archive, Delete
- **Archive is kept**: `tasks.status` is unconstrained `text` in the schema; the codebase already calls `updateTaskStatus(id, 'archived')` in the current board view — no schema migration needed

---

## 6. Board view parity

**Board columns:**

- Default columns map to status: `Todo`, `In Progress`, `Done`
- Each column header gets a `⋮` column-actions menu: **Rename column** (UI-only — updates a page-local `columnLabels: $state<Record<string, string>>` map; no DB write, no schema change needed this phase) and a separator placeholder for WIP limit (future)
- Add-task input is at the top of each column (already partially implemented)

**Grouping on the board:**

- `Group by` on the board changes what determines the column (default: Status, optionally Priority)
- When grouped by Priority, columns become the priority levels (`Urgent`, `High`, `Medium`, `Low`, `No Priority`)

**Item actions:**

- Items have the same consistent row-actions menu as the table (Start pomo, Mark done, Reopen, Archive, Delete)

---

## Key files

**Schema / DB (packages/db):**

- `packages/db/src/schema/project-views.ts` (new) — `projectViews` table
- `packages/db/src/schema/view-filters.ts` (new) — `viewFilters` table
- `packages/db/src/schema/index.ts` — add new table exports
- `packages/db/drizzle/` — generated migration SQL

**API (apps/web):**

- `apps/web/src/routes/api/workspaces/[workspaceId]/projects/[projectId]/views/+server.ts` (new) — GET, POST
- `apps/web/src/routes/api/workspaces/[workspaceId]/projects/[projectId]/views/[viewId]/+server.ts` (new) — PATCH, DELETE
- `apps/web/src/routes/api/workspaces/[workspaceId]/projects/[projectId]/views/[viewId]/filters/+server.ts` (new) — PUT (bulk replace)

**App pages:**

- `apps/web/src/routes/app/w/[slug]/p/[projectSlug]/+page.server.ts` — add `activeView` + `viewFilters` to load output
- `apps/web/src/routes/app/w/[slug]/p/[projectSlug]/+page.svelte` — full overhaul
- `apps/web/src/routes/app/recap/+page.svelte` — migrate period control

**UI package:**

- `packages/ui/src/lib/components/ui/view-tabs/` (new) — ViewTabs primitive

**`toggle-group` is unchanged.** No `disableDeselect` patch needed.
