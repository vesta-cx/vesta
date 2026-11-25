# ADR 0001: Vesta signs in through the shared mia.cx identity directory

## Status

Accepted (2026-11-18). Not yet set up in WorkOS.

## Context

Several mia.cx products need public sign-up, single sign-on, one account per person, and tenants whose organization and membership carry over to the next product. Each product also needs to start without its own auth setup.

## Decision

Vesta, Tastebase, the Remora chat and Earshot share one WorkOS directory, the **mia.cx** project. Earshot has no tenants; its readers sign in only to save their course progress.

- **WorkOS layout**: one WorkOS team holds two projects, each with staging and production environments:
  - **mia.cx**: the shared directory. Each product is its own WorkOS *application*, with its own client ID, redirect URIs, session policy and AuthKit branding. Users and organizations are shared.
  - **Maal**: Maal keeps its own project. Its organizations are households with family roles, a different kind of tenant than the mia.cx products.
- **Product access**: each product has a reserved organization. Sign-in passes that organization's ID, so AuthKit never shows an organization picker and the session belongs to the product.
- **Tenants**: tenants are ordinary WorkOS organizations. The product lists the user's tenant memberships through the WorkOS API and authorizes in the app, so the active session organization never changes what the app shows. Organization metadata `products` lists the products a tenant has turned on.
- **Permissions**: permission slugs are scoped by product, for example `vesta:projects:write`. One membership can hold roles for several products.
- **Sign-in methods**: magic code, passkeys, Google and GitHub. No passwords, so moving to another provider never involves password hashes.
- **One account per person**: WorkOS matches sign-ins by verified email, so a duplicate account only happens when someone signs up with a second address because they didn't know they already had an account. Every product prevents that in two places:
  - Its sign-in page says "Sign in with mia.cx" and shows badges for the other products the account works on. Sign-up and sign-in are the same button.
  - On a user's first sign-in to a product, the callback adds them to the product organization. If they already belong to another product's organization, the product shows a one-time notice, for example: "You already have a mia.cx account from Vesta, so it works here too."
- **Code**: products authenticate only through `@vesta-cx/auth`. The package moves to `@mia-cx/auth` when a second product adopts it.
- **Domain**: the WorkOS-hosted AuthKit domain until the first production launch, then `auth.mia.cx`. `id.mia.cx` belongs to the homelab's Authentik.

## Out of scope

- **Surnia**, the planned EU-sovereign workspace suite, gets its own EU-hostable identity provider. WorkOS is US-based with no EU data residency for AuthKit.
- **Logitland and Textile** keep Discord-only sign-in. Linking their accounts to mia.cx waits for a feature that needs it.

## Consequences

- One account and single sign-on across the mia.cx products. A new product needs one WorkOS application, not a new environment.
- Any product's server key can read and change every user and organization in the directory. One WorkOS outage stops sign-in for every product.
- The privacy policy must state that a mia.cx account is shared across products. Each product stores only the user ID and the data it needs.
- Signing in through the product organization bypasses a tenant's own sign-in policy. Revisit this when a tenant asks for enterprise SSO.
- Pricing: AuthKit is free up to 1M monthly active users, staging environments and projects are free, and a custom domain costs $99 a month ([pricing](https://workos.com/pricing), [projects](https://workos.com/docs/authkit/projects), [applications](https://workos.com/docs/authkit/applications)).
