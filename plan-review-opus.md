# Plan Review: Erato Auth Middleware

## Overall Assessment

This is a well-structured plan. The separation into types, middleware, helpers, and key management is clean, the KV-based API key approach is the right fit for Cloudflare Workers, and the implementation order is sensible. A few issues are worth addressing before implementation.

## What's Good

- **KV for API keys** is the correct Cloudflare primitive — high-read, low-write, globally replicated.
- **SHA-256 of high-entropy keys** is appropriate (no need for bcrypt/argon2 when the input is random).
- **Guest-by-default** is a nice pattern — unauthenticated requests still flow through middleware with typed context, so route handlers don't need null checks on `auth`.
- **Scopes are a reasonable initial set**, and `admin` as a wildcard bypass keeps things simple for now.
- **Order of implementation** (types → middleware → tests → integration) avoids building on untested foundations.
- **Out of scope** is clearly defined — prevents scope creep.

## Issues to Address

### 1. The `permissions` Drizzle schema file doesn't exist

The barrel at `packages/db/src/schema/index.ts` exports `./permissions` (line 7), but no `permissions.ts` file exists in that directory. The migration SQL shows `permissions` and `permission_actions` tables *are* in D1, so the tables exist at runtime — but there's no Drizzle schema to query against in TypeScript. Section 7 (permission-aware reads) depends on this. The plan should either:

- Note creating the Drizzle schema file as a prerequisite, or
- Defer section 7 entirely and have the middleware just provide `auth` context without the query pattern.

### 2. Two-layer auth model needs explicit articulation

The plan introduces two orthogonal authorization layers without naming them:

- **Scopes** (on the API key): "can this key perform reads on resources *at all*?"
- **Permissions table** (D1 rows): "can this *user* access *this specific* resource?"

Section 7 blends them without clarifying the relationship. A route handler would need to check both: `hasScope(auth, "resources:read")` AND then query the permissions table for row-level access. Making this two-layer model explicit in the plan would prevent confusion during implementation.

### 3. `admin` scope semantics are undefined

`hasScope` treats `admin` as a bypass for all scope checks, but does it also bypass the D1 permissions table? If an admin-scoped key requests an UNLISTED resource that has no permission row for the user, should it be returned? The plan should state whether `admin` means "all scopes" or "all scopes + all row-level permissions."

### 4. Plan references `value = "allow"` but the actual schema uses `action` + `value`

The `permissions` table in D1 has columns `action` (FK to `permission_actions.slug`) and `value` (default `'unset'`). Section 7's description ("value = allow") should align with the actual schema — you'd need to match on `action` (the slug) and check `value` against the correct enum.

### 5. KV eventual consistency after revocation

KV is eventually consistent — a revoked key could remain valid for up to 60 seconds in other regions. This is probably acceptable for API keys, but worth a one-line note in the plan so it's a conscious decision, not an oversight.

### 6. `expiresAt` + KV TTL interaction

Section 5 mentions "optional TTL from expiresAt" on `KV.put`. If TTL is set, KV auto-deletes the key, making the middleware's `expiresAt` check redundant (the key won't be found). If TTL is *not* set, expired keys accumulate forever. The plan should clarify the intent: is TTL the primary expiry mechanism (simple, but slightly imprecise due to TTL granularity), or is the middleware check the authoritative one (requires periodic KV cleanup)?

### 7. Plan frontmatter is empty

The YAML frontmatter (`name`, `overview`, `todos`) is blank. If Cursor uses this for plan tracking, it should be populated.

## Minor Suggestions

- **Key prefix per environment**: `vesta_` is good for leak detection, but `vesta_dev_` / `vesta_prod_` would prevent dev keys from accidentally working in production (since they'd hash to different KV keys in each namespace anyway, this is cosmetic but improves debugging).
- **CORS**: No mention of CORS configuration. If Erato will be called from browser JS, this will need to be addressed alongside auth. If server-to-server only, worth stating that assumption.
- **Key entropy note**: Two `crypto.randomUUID()` gives ~244 bits of randomness — more than sufficient, but the plan could note this is intentional so a future contributor doesn't "simplify" it to one UUID.

## Verdict

The plan is solid and ready for implementation with adjustments for items 1–4 above. Items 5–7 are good to note but not blockers. The core architecture (KV for keys, middleware that sets typed `auth` context, scope + permission layers) is sound for a Phase 1 Cloudflare Workers API.
