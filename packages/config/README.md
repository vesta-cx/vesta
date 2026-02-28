# @vesta-cx/config

Shared ESLint, Prettier, TypeScript, TailwindCSS, and lint-staged configs. Use in any JS/TS project or monorepo; extend in your app’s config files.

## Install

```bash
pnpm i -D @vesta-cx/config
```

Install peer dependencies as needed: `eslint`, `prettier`, `typescript`, `lint-staged` (all optional peers).

## Exports

| Subpath | Use |
|--------|-----|
| `@vesta-cx/config/eslint` | ESLint flat config (base). Use `@vesta-cx/config/eslint/svelte`, `eslint/markdown`, `eslint/json`, etc. for presets. |
| `@vesta-cx/config/prettier` | Prettier config (base). Use `prettier/svelte`, `prettier/astro`, etc. for presets. |
| `@vesta-cx/config/tailwindcss` | Tailwind shared config. |
| `@vesta-cx/config/lint-staged` | lint-staged config. |
| `@vesta-cx/config/typescript` | Base tsconfig. Use `typescript/node20`, `typescript/svelte`, `typescript/tsup`, etc. for targets. |

## Usage

### ESLint (flat config)

```js
// eslint.config.js
import base from "@vesta-cx/config/eslint";
import svelte from "@vesta-cx/config/eslint/svelte";

export default [...base, ...svelte];
```

The shared ESLint presets are implemented as first-party flat configs in this package (no runtime import of legacy style-guide modules), which keeps standalone consumers compatible.

### Prettier

```js
// prettier.config.js or .prettierrc.js
import base from "@vesta-cx/config/prettier";
export default base;
```

### TypeScript

```json
// tsconfig.json
{
  "extends": "@vesta-cx/config/typescript/node20"
}
```

### lint-staged

```js
// .lintstagedrc.js or package.json "lint-staged"
import config from "@vesta-cx/config/lint-staged";
export default config;
```

## License

MIT
