<!-- @format -->

# Erato Auth Implementation

Merged from three model implementations (auto, opus-4.6, gpt-5.3-codex) per the
[comparison plan](../../.cursor/plans/erato-auth-middleware.plan.md).

## Files

| File                           | Purpose                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `src/auth/types.ts`            | `AuthContext`, `GuestAuth`, `ApiKeyAuth`, `ApiKeyMeta`, `SCOPES`, `Scope`, `isApiKeyMeta`, `parseApiKeyMeta` |
| `src/auth/helpers.ts`          | `hashApiKey`, `isAuthenticated`, `requireAuth`, `hasScope`, `requireScope`, `scopeForMethod`                 |
| `src/auth/keys.ts`             | `generateApiKey`, `storeApiKey`, `revokeApiKey`, `getApiKeyMeta`                                             |
| `src/auth/middleware.ts`       | Auth middleware (guest / invalid / expired / valid key paths)                                                |
| `src/env.ts`                   | `AppEnv` type (shared by index, routes, registry)                                                            |
| `src/index.ts`                 | App entry with auth middleware on API router, `/health` outside auth                                         |
| `src/routes/resources/list.ts` | GET /resources with two-layer auth                                                                           |
| `src/auth/helpers.test.ts`     | 18 tests: hashApiKey, isAuthenticated, requireAuth, hasScope, requireScope, scopeForMethod                   |
| `src/auth/keys.test.ts`        | 7 tests: generate, store/get round-trip, revoke                                                              |
| `src/auth/middleware.test.ts`  | 8 tests: guest, non-Bearer, empty Bearer, invalid key, invalid JSON, expired, valid, future expiry           |
| `.cursor/rules/erato-auth.mdc` | Cursor rule: KV format, scope semantics, two-layer auth, admin bypass                                        |

## Merge provenance

- **Baseline:** opus-4.6 — `createMiddleware`, `HTTPException`, `getDb()`,
  inline subquery, 8 middleware tests
- **From codex:** `isApiKeyMeta`/`isStringArray` type guards (defensive parsing
  in types.ts)
- **From auto:** Separate `env.ts` for `AppEnv`, `SCOPES` const + `Scope` type

## Key decisions

1. **`requireScope` on guest → 403** (plan literal). Route handlers branch on
   `isAuthenticated()` first for public-read endpoints, so requireScope is only
   called on authenticated users in practice.
2. **Non-Bearer `Authorization` header → guest** (not 401). Aligns with "no API
   key = guest" interpretation.
3. **Response shape:** `{ resources: [...] }` for list endpoints.
4. **KV TTL:** `expirationTtl` (relative seconds) when `expiresAt` is set.
   Middleware also checks `expiresAt` for belt-and-suspenders.
5. **API key format:** `vesta_<uuid1><uuid2>` with dashes stripped (~69 chars).
   Prefix aids secret scanning.
6. **`AppEnv` in `env.ts`:** Breaks circular imports between `index.ts` ↔ route
   modules ↔ registry.

## Running tests

```bash
pnpm --filter @vesta-cx/erato test
```

## Integration notes

- `/health` is registered on the root app outside the auth-protected API router.
- All routes under `API_BASE_PATH` (`/v0`) go through `authMiddleware`.
- The list route uses `getDb(c.env.DB)` from `src/db/index.ts` (project
  convention).
- Admin endpoints (issue/revoke/list keys) are out of scope — see the plan for
  future work.
