<!-- @format -->

# @vesta-cx/utils

Shared utilities for Vesta apps: color helpers, easing, number/type helpers, permissions, cookies, and CORS. Used by SvelteKit apps and the UI package.

## Install

```bash
pnpm i @vesta-cx/utils
```

## Exports

| Subpath | Contents |
| --- | --- |
| `@vesta-cx/utils` | Main barrel: constants, types, numbers, easing, colors, permissions |
| `@vesta-cx/utils/cookies` | Cookie parsing and utilities |
| `@vesta-cx/utils/cors` | CORS helpers (allowlist-based origin checks) |

## Usage

```ts
import { clamp, formatPercent } from "@vesta-cx/utils";
import { parseCookies } from "@vesta-cx/utils/cookies";
import { createCorsHandle } from "@vesta-cx/utils/cors";
```

### Peer dependency

`@sveltejs/kit` is an optional peer (for cookie helpers in SvelteKit). In non-SvelteKit runtimes (e.g. Hono), you can use the other exports without it.

## License

ISC
