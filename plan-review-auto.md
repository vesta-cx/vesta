# Erato Auth Middleware Plan — Review

## Overall

The plan is **solid and implementable**. Goal, data shape, and flow are clear. A few refinements and one rule to align with.

---

## What works well

- **Goal** — Guest = public-only reads, authenticated = scopes + permissions. Clear and sufficient for Phase 1.
- **KV-only keys** — Storing only the hash in KV and not the raw key is correct. SHA-256 for high-entropy keys is fine.
- **Types** — `AuthContext` (guest | apikey) and `ApiKeyMeta` are well-scoped and easy to use from `c.get("auth")`.
- **Middleware** — Single place: read `Authorization`, validate or set guest, set `auth` on context. No D1 in the hot path for auth.
- **Helpers** — `requireAuth`, `hasScope`, `isAuthenticated` give route handlers a simple, consistent API.
- **Permission-aware reads** — Guest → LISTED only; authenticated → LISTED or `permissions` allow. You've left concrete queries for when routes exist, which is reasonable.
- **Order of implementation** — Types/helpers/keys first, then middleware and wiring, then tests and one read route, then docs/rule. Dependencies are in the right order.
- **Standing items** — Tests, docs, and a cursor rule are called out; "Review & close" is implied by the implementation order and test section.

---

## Gaps / things to decide

1. **AppEnv and KV**  
   `AppEnv` in `index.ts` currently has `Bindings: CloudflareBindings & { DB: D1Database }` and no `KV`. Wrangler already binds `KV`. The plan's "add `KV: KVNamespace` (if not already from wrangler types)" is right; in practice you'll need to add it to `AppEnv.Bindings` and add `Variables: { auth: AuthContext }` so `c.get("auth")` is typed. No change to the plan text needed; just do both when you "Extend AppEnv".

2. **CORS**  
   The repo has a CORS rule: APIs must enforce CORS with strict origin allowlisting. The plan doesn't mention CORS. For this plan you can leave CORS as "out of scope" with a one-liner (e.g. in §10), or add a short "CORS: add per app rule when we add browser/cross-origin clients." So: either explicitly out of scope or a single sentence so it's not forgotten.

3. **`storeApiKey` and TTL**  
   "optional TTL from expiresAt" is good. One nuance: KV `expirationTtl` is seconds from *now*, not an absolute time. So you either compute `max(0, expiresAt - now)` when storing or skip TTL and rely on `expiresAt` at validation time. The plan's "check expiresAt" in middleware already handles expiry; TTL is an optimization to avoid keeping expired keys in KV. Worth a brief note in implementation: "TTL from expiresAt = max(0, floor((expiresAt - now) / 1000))" or "no TTL; rely on expiresAt check only."

4. **Route layout vs middleware**  
   Erato's rule says routes live under `src/routes/` (e.g. `v1/workspaces/list.ts`) and are mounted from a central app. The plan says "apply auth middleware to the api router." That's consistent: you'll mount the auth middleware on the same `api` router (or subgroup) that mounts those route modules. No change needed; when implementing, apply middleware before the route modules are mounted.

5. **`permissions` table**  
   "Permission-aware read pattern" references a `permissions` table (subjectType/user, subjectId, objectType, objectId, value). The plan doesn't require defining that schema here; it's fine to defer to "when implementing the first resource/workspace routes." If the schema is already in `packages/db`, a short pointer in the plan could help; otherwise leaving it to the route implementation is acceptable.

---

## Security

- **No raw key in KV** — Only hash in KV; good.
- **Scopes** — Initial set is clear; `admin` as superset is standard.
- **401 for invalid/expired** — Same response for "bad key" and "expired" avoids leaking existence. Optional: same 401 for "no such key" vs "malformed key" (you already say "missing or invalid JSON → 401").
- **Bearer only** — Plan doesn't mention other schemes (e.g. API key in header with another name). For Phase 1, Bearer-only is fine; document it in "how to send API key."

---

## Verdict

- **Good plan.** Clear, ordered, and aligned with KV + D1 and existing Erato setup.
- **Worth adding:**  
  - A single line on CORS (out of scope or "add when needed").  
  - A small note on TTL vs `expiresAt` for KV (or "no TTL; validate expiresAt only") so the implementer doesn't guess.
- **No structural changes needed.** Proceeding as-is is reasonable; the two notes above are optional polish.
