# @vesta-cx/ui

Svelte 5 component library for Vesta: [shadcn-svelte](https://shadcn-svelte.com/)-based UI components, Bits-UI, design tokens (OKLCH, Tailwind v4), and layout primitives. Use in SvelteKit apps; extend, don’t rebuild.

## Install

```bash
pnpm i @vesta-cx/ui
```

Install peer dependencies if not already present (see your app’s stack):

- `svelte` ^5
- `@sveltejs/kit` ^2
- `@vesta-cx/utils` ^1.0.0
- `bits-ui` ^2.14
- `tailwindcss` ^4
- Others as listed in `package.json` peerDependencies

## Usage

### Import components

```svelte
<script>
  import { Button } from "@vesta-cx/ui";
  import { Card, CardHeader, CardTitle, CardContent } from "@vesta-cx/ui";
</script>
<Button>Click</Button>
<Card>...</Card>
```

### Subpaths

- `@vesta-cx/ui` — main component barrel
- `@vesta-cx/ui/components/ui/*` — individual UI components
- `@vesta-cx/ui/components/layout/*` — layout (header, footer, section, main)
- `@vesta-cx/ui/components/utils/*` — theme toggle, cookie consent, etc.
- `@vesta-cx/ui/styles/*` — SCSS design tokens (if your build supports it)

### Theming

Theming is driven by `data-theme` (`light`, `dark`, `auto`) and OKLCH design tokens. See [shadcn-svelte theming](https://shadcn-svelte.com/docs/theming) and your app’s Tailwind config that extends the UI package tokens.

### Building

Consuming apps use the built `dist/`; the package must be built before use. In a monorepo run `pnpm --filter @vesta-cx/ui build` after changing the UI package.

## License

ISC
