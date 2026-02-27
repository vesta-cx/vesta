---
title: Navigation Header Visibility Logic
description: Architectural decision for conditional header visibility on UGC pages
---

# Navigation Header Visibility Logic

## Decision

The vesta web app header should conditionally hide on UGC (user-generated content) pages based on visitor authentication state:

- **UGC routes (e.g. `/[workspace]/*`) + not logged in** → Header hidden until scroll down
- **UGC routes + logged in** → Header always visible
- **Non-UGC routes (e.g. `/about`, `/collections`)** → Header always visible

## Implementation Strategy

Use **global stores** to coordinate visibility logic across layouts:

1. **`onUgcPage` store** — Set to `true` by `routes/[workspace]/+layout.svelte` on mount, reset to `false` on destroy
2. **`isLoggedIn` store** — Set by auth middleware once user session is determined
3. **Root `+layout.svelte`** — Subscribes to both stores and computes `hideByDefault = $onUgcPage && !$isLoggedIn`
4. **Header component** — Receives `hideByDefault` boolean and toggles scroll-based visibility behavior

### Why Not Route Groups?

Route groups (`routes/(userland)/` + `routes/(marketing)/`) would also work, but the store-based approach is preferred here because:

- Auth state is dynamic and checked at runtime; route structure is static
- A user logging in/out shouldn't require a route transition
- Auth middleware in `+layout.server.js` already computes session state; stores keep that concern in one place
- Less refactoring: no need to reorganize the route tree immediately

### Future: Auth Middleware

Once `apps/web` has proper auth middleware (see `apps/sona` for reference implementation using `@vesta-cx/utils`), the middleware should:

1. Check session via WorkOS or stored token
2. Set `isLoggedIn` store to `true`/`false`
3. Attach user object to `$page.data` if authenticated

This keeps auth state centralized and reusable by the header visibility logic.

## Store Definitions

Create `src/lib/stores/ui.ts`:

```ts
import { writable } from "svelte/store"

export const onUgcPage = writable(false)
export const isLoggedIn = writable(false)
```

## Header Component Integration

The header component receives `hideByDefault: boolean` and applies conditional CSS/behavior:

```svelte
<script lang="ts">
  export let hideByDefault = false;
  let isScrolled = $state(false);

  const shouldShow = hideByDefault ? isScrolled : true;

  // scroll listener updates isScrolled
</script>

<header class:hidden={!shouldShow} />
```

## Related

- See `apps/sona` for WorkOS auth integration pattern
- See `packages/utils/src/auth/` for shared auth helpers
