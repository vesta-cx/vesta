# Implementation contract: collection visibility and dashboard resource reads

This document defines required behavior for resource visibility in collections and for dashboard resource listing. Implementations (e.g. Erato, vesta app) must follow this contract.

**Collection type and kind** are defined in [Collection type and kind](./collection-types.md). That doc defines `type` (static | manual | smart), `kind` (semantic role), lifecycle (exactly one static per kind per owner, created with owner, cannot delete without deleting owner), and which kind governs resource visibility.

---

## 1. Resource status and where it applies

- **`resources.status`** (`LISTED` | `UNLISTED`) controls whether a resource appears in the **static resources collection** only.
- **Static resources collection** — A collection with **`type === 'static'` and `kind === 'resources'`**. There is exactly one per owner (user or workspace). It represents the canonical “all resources” of that owner. See [Collection type and kind](./collection-types.md).
- **Manual collection** — A collection with **`type === 'manual'`**. Items are explicitly added by the owner. `kind` is null. UNLISTED resources may appear.

**Rules:**

- In a **static resources collection** (`type === 'static'` and `kind === 'resources'`), a resource MUST be included only if `resources.status === 'LISTED'`. Resources with `status === 'UNLISTED'` MUST NOT appear there.
- In **manual collections** (`type === 'manual'`), a resource MAY appear regardless of `resources.status`. If the owner added the resource to the collection, it is shown (subject to permissions and collection visibility). So UNLISTED resources can still appear in manual collections.

---

## 2. Recursive behavior when collections contain collections

When a collection **C** contains items of type `collection` (nested collections), visibility of a **resource** that is only reachable through a chain of collections must be resolved by tracing back to the **collection that directly contains the resource**.

**Definitions:**

- **Origin collection (for a resource in a chain)** — The collection that has a `collection_items` row with `itemType === 'resource'` and `itemId === resource.id`. That is the collection “closest” to the resource.
- **Chain** — A path from a root collection through zero or more “collection” items down to a resource (e.g. Root → Collection A → Collection B → Resource R; origin for R is B).

**Rule:**

- When deciding whether to show a resource that is reached through a chain of collections, determine the **origin collection** for that resource.
  - If the origin collection has **`type === 'static'` and `kind === 'resources'`**, then `resources.status` applies: show the resource only if `status === 'LISTED'`.
  - If the origin collection has any other type or kind (e.g. `type === 'manual'` or `kind === 'following'`), the resource is visible in that chain regardless of `resources.status`.

**Example:**

- Resource R has `status: 'UNLISTED'`.
- R is in Collection B, where B is the static resources collection of Owner 2 (`type === 'static'`, `kind === 'resources'`).
- Collection B is in Collection A (e.g. following or manual) of Owner 2.
- Collection A is in Collection Root (e.g. another user’s manual list).
- When resolving whether R appears in Root: origin collection for R is B. B is static with kind resources → R is UNLISTED → R must **not** be listed in Root (and the chain is treated as hiding R).

So visibility “trickles” from the resource’s origin collection: if that collection has `type === 'static'` and `kind === 'resources'`, respect LISTED/UNLISTED; otherwise include the resource in the chain.

---

## 3. Dashboard: direct read from resources table

When the **dashboard** shows “my resources”, “my workspace’s resources”, or “my org’s resources”, the implementation MUST read **directly from the `resources` table** (filtered by `ownerType` / `ownerId` or org scope), and MUST NOT derive the list from `collection_items`.

- **Rationale:** The dashboard is an ownership view. The source of truth for “what I (or my workspace/org) own” is the resources table. Using `collection_items` would incorrectly tie the list to collection membership and would not guarantee all owned resources are shown (e.g. resources not yet in any collection, or only in UNLISTED-static collections).
- **Scope:** This applies to the dashboard UI and any API that is explicitly “list resources I/we own” for the current user, workspace, or org. It does not apply to “list items in collection X” or “list resources in my feed”, which correctly use collections.

---

## Summary

| Context | Behavior |
|--------|----------|
| Collection with `type === 'static'` and `kind === 'resources'` | Include resource only if `resources.status === 'LISTED'` |
| Collection with `type === 'manual'` (or other type/kind) | May include resource regardless of `resources.status` |
| Chain (collections → … → resource) | Use origin collection: if static + kind resources ⇒ apply LISTED/UNLISTED; else ⇒ show |
| Dashboard “my/workspace/org resources” | Read from `resources` table only; do not use `collection_items` |
