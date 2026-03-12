<!-- @format -->

# clean

Clean files and directories using include/exclude globs with command and tag selection.

## Features

- Prettier-style config discovery (`.cleanrc*`, `clean.config.*`, or `package.json#clean`)
- Global + per-command matching (`include` / `exclude`)
- Dynamic commands (`clean turbo`, `clean storybook`, `clean abcd`, etc.)
- Tag selection (`--tags`) with default union semantics
- Runtime controls (`mode`, `dryRun`, `confirm`, `interactive`, `verbose`, `ignoreErrors`, `protect`, `strategy`, `force`, `report`)
- Path traversal protection
- Backward compatibility for legacy keys (`dirs`, `clean`, `installClean`, `buildClean`, `devClean`, `vesta:clean`, `cleanDirs`)

## Installation

```bash
pnpm i -D clean
```

## Quick Start

```bash
clean init
```

`init` creates `.cleanrc.json` and adds common scripts if missing. By default, `init` prompts you to choose which built-ins to include when running in an interactive terminal.

## Configuration

### Config lookup order

1. `.cleanrc`, `.cleanrc.json`, `.cleanrc.yaml`, `.cleanrc.yml`
2. `.cleanrc.cjs`, `.cleanrc.mjs`, `.cleanrc.js`
3. `clean.config.cjs`, `clean.config.mjs`, `clean.config.js`
4. `package.json` under `clean`

First match wins (no merge across files).

### `.cleanrc.json`

```json
{
  "$schema": "https://unpkg.com/@mia-cx/clean/schema",
  "include": [".cache/global/**"],
  "exclude": ["**/*.log"],
  "report": "summary",
  "protect": [".git/**", "pnpm-lock.yaml"],
  "commands": {
    "install": {
      "include": ["node_modules"],
      "tags": ["deps"]
    },
    "turbo": {
      "include": [".turbo/**"],
      "tags": ["cache", "build"],
      "dryRun": false
    },
    "assets": {
      "include": ["dist/**/*", "public/**/*.map"],
      "exclude": ["dist/keep/**"],
      "mode": "contentsOnly"
    }
  }
}
```

- Top-level `include`/`exclude` are the global scope.
- `commands.<name>` entries are merged with global scope during that command run.

## CLI

```bash
clean [command] [options]
```

### Behavior

- `clean` => run global entry only
- `clean <command>` => run global + command entry
- unknown command => fail with available command names
- `--tags=a,b` => run entries with ANY matching tag (union)
- `command + --tags` => union by default; pass `--tag-intersect` for intersection behavior
- CLI flags override config behavior values for that run

### Examples

```bash
clean
clean turbo
clean install
clean --tags=cache,build
clean turbo --tags=cache                # union behavior
clean turbo --tags=cache --tag-intersect
clean turbo --include=.turbo/** --exclude=**/*.log
clean assets --mode=contentsOnly --dry-run --verbose
clean --cwd=packages/my-app --report=json
```

### Useful runtime flags

- `--include=<csv>`
- `--exclude=<csv>`
- `--mode=delete|contentsOnly`
- `--dry-run[=true|false]`
- `--confirm[=true|false]`
- `--interactive[=true|false]`
- `--verbose[=true|false]`
- `--ignore-errors[=true|false]`
- `--protect=<csv>`
- `--strategy=sequential|parallel`
- `--enabled[=true|false]`
- `--force[=true|false]`
- `--report=none|summary|json`
- `--tags=<csv>`
- `--tag-intersect`

### Special command

```bash
clean init
clean init --tools=install,turbo,wrangler
clean init --no-prompt
```

Creates config if absent and adds default scripts.

`init` options:

- `--tools=<comma,list>`: select built-in commands without prompting
- `--no-prompt`: skip interactive selection (defaults to `install` only unless `--tools` is provided)

## Built-ins

`clean` ships built-in command templates for common tools/frameworks in `src/built-ins.ts`:

- Frameworks: `next`, `nuxt`, `svelte`, `astro`, `remix`, `angular`
- Build tools: `vite`, `webpack`, `rollup`, `parcel`, `esbuild`, `swc`
- Testing: `vitest`, `jest`, `playwright`, `cypress`
- Docs/UI: `storybook`, `docusaurus`
- Monorepo/task: `turbo`, `nx`
- Infra: `wrangler`, `serverless`, `sst`
- Package managers: `pnpm-store`, `npm-cache`, `yarn-cache`, `bun-cache`
- Core: `install`

These are surfaced by `init` and docs. Runtime does not silently inject tool presets.

## JSON Schema / IntelliSense

Use:

```json
{
  "$schema": "https://unpkg.com/@mia-cx/clean/schema"
}
```

Schema file in package: `schema/cleanrc.schema.json`.

## Backward Compatibility

Legacy keys are still accepted and normalized:

- `dirs` / `clean` -> top-level `include`
- `installClean` -> `commands.install.include`
- `buildClean` -> `commands.build:clean.include`
- `devClean` -> `commands.dev:clean.include`
- `package.json` fallback: `vesta:clean.dirs`, `cleanDirs` -> top-level `include`

## Safety

- Prevents path traversal outside `cwd`
- Ignores missing directories without failing

## API

```ts
import { loadConfig, runClean } from "@mia-cx/clean";

const config = await loadConfig(process.cwd());
await runClean(config, { command: "turbo", tags: ["cache"], dryRun: true });
```
