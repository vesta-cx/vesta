---
title: auth/types.ts
description: Auth domain types and config contracts
---

# `types.ts`

Source: `packages/utils/src/auth/types.ts`

This file defines core type contracts used across auth helpers and consuming apps.

## `AuthSession`

Encrypted payload stored in the session cookie.

- `userId: string`
- `email: string`
- `organizationId: string`
- `firstName?: string`
- `lastName?: string`
- `profilePictureUrl?: string`
- `accessToken: string`
- `refreshToken: string`

Notes:

- This is the canonical shape used by `createSession`/`getSession`.
- Include only fields needed for request/session logic and fast UI hydration.

## `AuthResult`

Normalized result returned by WorkOS code exchange helper.

- `user: WorkOSUser`
- `organizationId: string | undefined`
- `accessToken: string`
- `refreshToken: string`

Notes:

- Decouples app code from raw WorkOS response naming.
- Used by callback handlers to map provider response into `AuthSession`.

## `WorkOSUser`

User object shape expected from WorkOS User Management:

- `id`
- `email`
- `first_name`
- `last_name`
- `email_verified`
- `profile_picture_url?`
- `created_at`
- `updated_at`

## `AuthHandleConfig`

Config contract for `createAuthHandle`.

- `protectedPaths: string[]` (required)
- `loginPath?: string` (default `/auth/login`)
- `postLoginRedirect?: string` (default `/`)
- `cookieName?: string` (default `session`)
- `sessionMaxAge?: number` (default `86400`)

Notes:

- Current `handle.ts` directly uses `protectedPaths`, `loginPath`, and `cookieName`.
- `postLoginRedirect` and `sessionMaxAge` are useful app-level metadata, but not enforced in the handle itself.

## `AuthEnv`

Expected auth-related env vars on `platform.env`:

- `PRIVATE_WORKOS_CLIENT_ID`
- `PRIVATE_WORKOS_API_KEY`
- `PRIVATE_WORKOS_ORG_ID`
- `PRIVATE_WORKOS_COOKIE_PASSWORD`
