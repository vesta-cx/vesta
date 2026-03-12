# Collection type and kind

Collections have two fields that govern behavior and semantics:

- **`type`** — Behavioral category: who populates the collection, whether it is protected, how many can exist per owner.
- **`kind`** — Semantic role: what the collection is *for*. Only relevant when `type === 'static'` (and in the future when `type === 'smart'`). Nullable for manual collections.

---

## type (behavioral)

| type      | Meaning | Created | Per owner | Deletable |
| --------- | ------- | ------- | --------- | --------- |
| **static** | System-defined; system-populated. | Automatically when a user or workspace is created. | Exactly one static collection **of each kind** per owner. | No. Cannot be deleted without deleting the owner (user or workspace). |
| **manual** | User- or workspace-curated; owner explicitly adds/removes items. | When the owner creates a list. | Zero or more. | Yes. |
| **smart**  | (Future) Algorithmic or system-curated; e.g. trending, recommended. | TBD. | TBD. | TBD. |

So: for each owner there is **exactly one** static collection per semantic kind (resources, following, likes, etc.). Those static collections are created when the owner is created and cannot be deleted except by deleting the owner.

---

## kind (semantic)

**Relevant when `type === 'static'`** (and optionally when `type === 'smart'`). When `type === 'manual'`, `kind` is null.

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

- **type** = `'static' | 'manual' | 'smart'` — behavioral; drives creation, protection, and deletion rules.
- **kind** = `'resources' | 'following' | ... | 'notifications'` — semantic; required when type is static; null when type is manual.
- Exactly one static collection of each kind per owner; created when the owner is created; cannot delete without deleting the owner.
- “Static resources collection” = `type === 'static'` and `kind === 'resources'`. Use that when applying the [collection visibility and dashboard contract](./collection-visibility-and-dashboard-contract.md).
