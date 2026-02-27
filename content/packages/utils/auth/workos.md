---
title: auth/workos.ts
description: WorkOS authorization URL, token exchange, and logout URL helpers
---

# `workos.ts`

Source: `packages/utils/src/auth/workos.ts`

This file contains provider-specific helpers for WorkOS User Management.

## Internal response type

`WorkOSAuthResponse` models the raw authenticate endpoint response so helpers can normalize output.

## `getAuthorizationUrl(...)`

```ts
getAuthorizationUrl({
  clientId,
  redirectUri,
  organizationId,
  state?
}): string
```

Purpose:

- Build WorkOS AuthKit authorization URL for redirecting users to login.

Behavior:

- Creates query params:
  - `client_id`
  - `redirect_uri`
  - `response_type=code`
  - `provider=authkit`
  - `organization_id`
- Adds optional `state` when provided.
- Returns `https://api.workos.com/user_management/authorize?...`.

## `authenticateWithCode(...)`

```ts
authenticateWithCode({
  code,
  clientId,
  apiKey
}): Promise<AuthResult | null>
```

Purpose:

- Exchange auth code from callback URL for user profile + tokens.

Behavior:

- Sends `POST` to `https://api.workos.com/user_management/authenticate`.
- Request body includes:
  - `client_id`
  - `client_secret`
  - `grant_type='authorization_code'`
  - `code`
- Returns `null` when:
  - HTTP response is not OK
  - Required user fields are missing (`id`, `email`)
- Returns normalized `AuthResult` when successful:
  - `user`
  - `organizationId`
  - `accessToken`
  - `refreshToken`

## `getLogoutUrl(...)`

```ts
getLogoutUrl({
  accessToken,
  returnTo?
}): string | null
```

Purpose:

- Build WorkOS session logout URL to terminate provider-side session.

Behavior:

- Splits JWT (`accessToken`) and decodes payload.
- Reads `sid` claim from decoded payload.
- Returns `null` when payload parse fails or `sid` is missing.
- Builds URL:
  - Base: `https://api.workos.com/user_management/sessions/logout`
  - Required param: `session_id=<sid>`
  - Optional param: `return_to=<url>`
