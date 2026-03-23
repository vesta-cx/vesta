---
title: auth/index.ts API
description: Archived re-export surface for the retired @vesta-cx/utils/auth package
---

<!-- @format -->

## `index.ts` API

> Archived note: `@vesta-cx/utils/auth` has been retired. Current shared auth exports come from `@vesta-cx/auth`.

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
  getLogoutUrl,
} from "@vesta-cx/utils/auth";
```
