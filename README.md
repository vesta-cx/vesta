<!-- @format -->

```txt
pnpm install
pnpm run dev
```

```txt
pnpm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
pnpm run cf-typegen
```

`dev` and `deploy` are version-aware:

- API major is derived from `package.json` via `semver`
- deploy target is `wrangler --env v<major>`
- route is env-scoped to `erato.vesta.cx/v<major>/*`

This allows multiple API majors to stay live concurrently (for example, `v1` and `v2`) because each major is deployed to a separate Wrangler environment/Worker service.

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>();
```
