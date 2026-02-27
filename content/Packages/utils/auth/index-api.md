---
title: auth/index.ts API
description: Re-export surface for @vesta-cx/utils/auth
---

# `index.ts` API

Source: `packages/utils/src/auth/index.ts`

`index.ts` is a barrel module that defines the public import surface for `@vesta-cx/utils/auth`.

## Re-exported Types

- `AuthSession`
- `AuthResult`
- `WorkOSUser`
- `AuthHandleConfig`
- `AuthEnv`

## Re-exported Functions

- Session helpers from `session.ts`
  - `createSession`
  - `getSession`
  - `clearSession`
- WorkOS helpers from `workos.ts`
  - `getAuthorizationUrl`
  - `authenticateWithCode`
  - `getLogoutUrl`
- Hook factory from `handle.ts`
  - `createAuthHandle`

## Usage

```ts
import {
  createAuthHandle,
  getAuthorizationUrl,
  authenticateWithCode,
  createSession,
  getSession,
  clearSession,
  getLogoutUrl
} from '@vesta-cx/utils/auth';
```
