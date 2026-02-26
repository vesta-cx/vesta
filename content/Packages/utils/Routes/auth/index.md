---
title: Auth Routes
authors:
description: Authentication endpoints
created: 2025-10-20T15:34:33+02:00
modified: 2025-10-22T19:25:11+02:00
license:
license_url:
---

## Authentication Routes

These routes handle user authentication and session management:

- **`/auth/login`** — Login entry point. Initiates WorkOS authorization flow.
- **`/auth/callback`** — OAuth callback. Receives authorization code from WorkOS, exchanges for session.
- **`/auth/error`** — Error page displayed if authentication fails.
- **`/auth/logout`** — Logout handler. Clears session and redirects.
- **`/auth/me`** — Current user endpoint. Returns authenticated user profile.

For implementation details, see [WorkOS Auth Setup](../../workos-auth-setup.md).
