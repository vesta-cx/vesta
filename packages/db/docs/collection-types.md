# Collection type and kind

Collections have two fields that govern behavior and semantics:

- **`type`** — Behavioral category: who populates the collection, whether it is protected, how many can exist per owner.
- **`kind`** — Semantic role: what the collection is *for*. Required when `type === 'auto'`, null for manual collections.

---

## type (behavioral)

| type      | Meaning | Created | Per owner | Deletable |
| --------- | ------- | ------- | --------- | --------- |
| **auto**   | System-defined; system-populated; server-managed. | Automatically when a user or workspace is created. | Exactly one auto collection **of each kind** per owner. | No for non-admin routes. |
| **manual** | User- or workspace-curated; owner explicitly adds/removes items. | When the owner creates a list. | Zero or more. | Yes. |
| **smart**  | (Future) Algorithmic/system-curated layer (likely maps to `type='auto'` plus strategy metadata). | TBD. | TBD. | TBD. |

So: for each owner there is **exactly one** auto collection per semantic kind (resources, following, likes, etc.). Those auto collections are server-managed.

---

## kind (semantic)

**Relevant when `type === 'auto'`**. When `type === 'manual'`, `kind` is null.

| kind             | Meaning | Populated by | Resource visibility |
| ---------------- | ------- | ------------ | ------------------- |
| **resources**    | Canonical “all resources” of the owner. | System: all resources with matching owner. | Only LISTED resources. See [visibility contract](./collection-visibility-and-dashboard-contract.md). |
| **following**    | Entities (users, workspaces, collections) the owner follows. | System: follow engagements. | N/A. |
| **reposts**      | Resources the owner reposted. | System: repost engagements. | N/A. |
| **likes**        | Resources the owner liked. | System: like engagements. | N/A. |
| **bookmarks**    | Resources the owner bookmarked. | System: bookmark engagements. | N/A. |
| **subscriptions**| Workspaces the owner has subscription access to. | System: subscribe engagements. | N/A. |
| **comments**     | Resources the owner has commented on. | System: comment engagements. | N/A. |
| **notifications**| Inbox-style view (mentions, replies, etc.). | System: engagements; may be virtual. | N/A. |

Manual collections (`type === 'manual'`) have no kind; the collection’s `name` is the user-facing label. They may contain any item type; UNLISTED resources may appear.

---

## Summary

- **type** = `'auto' | 'manual'` — behavioral; drives mutability and creation semantics.
- **kind** = `'resources' | 'following' | ... | 'notifications'` — semantic; required when type is auto; null when type is manual.
- Exactly one auto collection of each kind per owner; created/managed server-side.
- “Auto resources collection” = `type === 'auto'` and `kind === 'resources'`. Use that when applying the [collection visibility and dashboard contract](./collection-visibility-and-dashboard-contract.md).
