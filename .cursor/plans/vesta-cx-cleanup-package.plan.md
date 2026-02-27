---
name: cleanc package
overview: Add shared package cleanc (unscoped npm name) with Prettier-style config, per-command dirs, CLI override; adopt in all workspaces; retire root script.
todos:
  - id: pkg-scaffold
    content: Scaffold packages/cleanc (package.json name cleanc, tsconfig, tsup, src + bin)
    status: pending
  - id: config-resolution
    content: Implement config load (cosmiconfig, .cleancrc*, cleanc.config.*, package.json cleanc key)
    status: pending
  - id: run-cli
    content: Implement run (per-command dirs, defaults) and CLI (command, --dirs, --cwd)
    status: pending
  - id: init-cli
    content: Implement cleanc init — add devDependency, create default config, add scripts if missing
    status: pending
  - id: adopt-workspaces
    content: Add cleanc to root and all workspaces; switch scripts to cleanc bin
    status: pending
  - id: turbo-clean
    content: Add clean task to turbo.json (optional; root clean = turbo run clean or cleanc clean)
    status: pending
  - id: remove-script
    content: Remove scripts/clean.mjs after adoption
    status: pending
  - id: tests
    content: Tests — unit tests for config load and run (fixtures/temp dirs); mark complete when pass
    status: pending
  - id: capture-knowledge
    content: Capture Knowledge — add .cursor/rules rule for cleanc config (file names, package.json key)
    status: pending
  - id: documentation
    content: Documentation — README in packages/cleanc (config shape, CLI, cleanc init, file names); optional AGENTS link
    status: pending
  - id: review-close
    content: Review & Close — path safety, backward compat, all workspaces updated, run clean to verify
    status: pending
isProject: false
---

# cleanc package

## Goals

- **Package** **cleanc** (unscoped npm name): resolves config, deletes dirs per command, supports CLI dir override.
- **Config discovery** (Prettier-style): `.cleancrc`, `.cleancrc.[mc]?[tj]s`, `cleanc.config.[mc]?[tj]s`, and `package.json` key `cleanc`.
- **Per-command dirs** in config; **inline override** via CLI `--dirs=...`.
- **Adoption**: all modules use cleanc and can add a config; root script retired.

## Config shape

- **Config keys**: `clean`, `installClean`, `buildClean`, `devClean`. Each optional array of directory names (relative to cwd).
- **Defaults** (when a key is missing):  
`clean`: `['.turbo', '.wrangler', '.svelte-kit', 'dist']`  
`installClean`: same as `clean` plus `'node_modules'`  
`buildClean` / `devClean`: same as `clean`.
- **CLI override**: `--dirs=dir1,dir2` (or `--dirs dir1,dir2`) overrides the resolved list for that run.

Example in `package.json`:

```json
"cleanc": {
  "clean": [".turbo", ".svelte-kit", "dist"],
  "installClean": [".turbo", ".svelte-kit", "dist", "node_modules"]
}
```

Example `.cleancrc.json`:

```json
{
  "clean": [".turbo", "dist"],
  "devClean": [".turbo", ".svelte-kit"]
}
```

## Config resolution

- Use **cosmiconfig** (search name `cleanc`) so discovery matches common tooling:
  - `.cleancrc` (JSON/YAML by extension or content)
  - `.cleancrc.json`, `.cleancrc.yaml`, `.cleancrc.yml`
  - `.cleancrc.[mc]?[tj]s` (JS/TS, CJS/MJS)
  - `cleanc.config.[mc]?[tj]s`
  - `package.json` → key `cleanc`
- Resolve from `process.cwd()` (or optional `--cwd`). No merging with parent configs; one config per package.

## Dependencies (recommended)


| Package                           | Use                                                           | Note                                                                                                                                         |
| --------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **cosmiconfig**                   | Config discovery (.cleancrc*, cleanc.config.*, package.json). | Standard for Prettier-style tool config; no need to reimplement.                                                                             |
| **rimraf**                        | Recursive removal of each target dir.                         | Use instead of raw `fs.rmSync` for cross-platform behavior, symlinks, and busy-file retries. Sync API fits CLI: `rimraf.sync(resolvedPath)`. |
| ~~del / del-cli~~                 | —                                                             | del-cli is a standalone CLI; we build our own. del (library) is an alternative to rimraf but rimraf is more common in tooling and has sync.  |
| ~~clean-scripts / clean-package~~ | —                                                             | Different purpose (script runner / package.json cleaner); not libraries to depend on.                                                        |


**Minimal deps**: `cosmiconfig` + `rimraf`. Path safety (resolve under cwd) stays in our code; rimraf does the actual removal.

## Package layout

- **Location**: [packages/cleanc](packages/cleanc) (repo name cleanc; you’ll update the GH repo). If this is a **git submodule**, implement inside that repo; root adds `devDependency` `cleanc: "workspace:*"`.
- **Contents**:
  - `src/load-config.ts` — cosmiconfig load, normalize to `{ clean, installClean, buildClean, devClean }` with defaults.
  - `src/run.ts` — given command and optional dir override: get dirs, resolve each under cwd (path safety), then **rimraf.sync(resolvedPath)** for each. **Path safety**: resolve each dir relative to cwd and ensure realpath stays under cwd before deleting (no path traversal).
  - `src/cli.ts` — CLI entry: parse `[command]` and `--dirs=...`; if `command === 'init'` call init, else call `run()`, exit.
  - Bin in package.json: `"bin": { "cleanc": "./dist/cli.js" }` (or equivalent built output).
  - Optional `src/init.ts` — `cleanc init`: add devDependency (detect package manager), create `.cleancrc.json` if no config, add scripts to package.json if missing.
- **Build**: Same pattern as [packages/config](packages/config): tsup, dual ESM/CJS if desired; or single ESM with `"type":"module"` and `#!/usr/bin/env node` in the built CLI.
- **Exports**: Bin only is enough for Phase 1; optional `export { loadConfig, runClean }` for programmatic use later.

## CLI behavior

- **Usage**: `cleanc [command] [--dirs=dir1,dir2] [--cwd=path]`
- **Commands**: `clean` (default), `install:clean`, `build:clean`, `dev:clean`.
- **Semantics**: Resolve config for cwd → get dir list for `command` → if `--dirs` present, use that list instead → delete each dir under cwd (ignore missing/permission).
- **Scripts** (unchanged semantics): Package only deletes dirs. No running `pnpm i` or `pnpm run build` from the package.
  - `clean`: `cleanc clean` or `cleanc`
  - `install:clean`: `cleanc install:clean && pnpm i`
  - `build:clean`: `cleanc build:clean && pnpm run build`
  - `dev:clean`: `cleanc dev:clean && pnpm run dev`

## cleanc init

A **setup command** to add cleanc to a project in one go: install devDependency, create config with sensible defaults, and add npm scripts if missing.

- **Usage**: `cleanc init` (run from project root, or `cleanc init --cwd=path`). Can be run via `pnpm dlx cleanc init` before the package is installed, or after install.
- **Actions** (idempotent where possible):
  1. **Add devDependency**: Run the project’s package manager to add `cleanc` as devDependency. Detect manager from lockfile (`pnpm-lock.yaml` → `pnpm i -D`, `package-lock.json` → `npm i -D`, `yarn.lock` → `yarn add -D`). In this monorepo, use `pnpm i -D cleanc` (workspace protocol if applicable).
  2. **Create config if none**: If no existing cleanc config is found (no `.cleancrc`*, no `cleanc.config.`*, no `package.json` `cleanc` key), write `.cleancrc.json` with the same default shape (e.g. `clean`, `installClean`, `buildClean`, `devClean` with the standard default dirs). Do not overwrite an existing config.
  3. **Add scripts if missing**: In `package.json`, add `clean`, `install:clean`, `build:clean`, `dev:clean` only if each is absent. Use the same script bodies as in Adoption (cleanc bin + `&& pnpm i` etc.). Skip or simplify for packages that don’t have `build` or `dev` (e.g. docs: only `clean`, `install:clean`, `dev:clean` with `pnpm run docs`).
- **Output**: Print what was done (e.g. “Added devDependency”, “Created .cleancrc.json”, “Added scripts: clean, install:clean, …” or “Config already present, skipped”).
- **Implementation**: New subcommand in CLI (`cleanc init`); optional `src/init.ts` that performs the three steps and is called from `cli.ts` when `command === 'init'`.

## Adoption

- **Root** [package.json](package.json): Add `devDependency`: `"cleanc": "workspace:*"`. Replace `"clean": "node scripts/clean.mjs"` with `"clean": "cleanc clean"`; keep `build:clean` / `dev:clean` / `install:clean` as above (using `cleanc <command>` + `&& pnpm i` etc.).
- **Every workspace** that currently uses [scripts/clean.mjs](scripts/clean.mjs): Add `cleanc` as devDependency and switch `clean` to `cleanc clean`; keep composite scripts using `cleanc install:clean`, etc. Workspaces: root, apps/sona, apps/erato, apps/web, apps/euterpe, apps/docs, packages/config, packages/db, packages/ui, packages/storage, packages/utils, tools/test-pages.
- **Optional**: Add a `clean` task in [turbo.json](turbo.json) so `turbo run clean` cleans all workspaces; then root `clean` could be `turbo run clean` to clean root + all deps, or stay `cleanc clean` to clean root only (current behavior).

## Backward compatibility

- If config key `cleanc` is absent but `vesta:clean` or `cleanDirs` exists in package.json, treat it as the `clean` list so existing configs keep working until migrated.

## Removal

- Delete [scripts/clean.mjs](scripts/clean.mjs) after all workspaces use **cleanc**.

## Implementation notes

- **Prior art**: No existing npm package was found that provides Prettier-style config discovery plus per-command dir lists and CLI override; rimraf/del-cli have no rc config; clean-scripts is a script runner, not a dir cleaner.
- **cosmiconfig**: Use `cosmiconfig('cleanc', { searchPlaces: [...] })` and optionally restrict to the exact list you want. Support for `.cleancrc.ts` / `cleanc.config.ts` may require a loader (e.g. tsx or jiti) if you want TS config files without compiling the package to TS first; otherwise stick to JS/JSON for config files.
- **pnpm workspace**: [pnpm-workspace.yaml](pnpm-workspace.yaml) already has `packages/`*; new `packages/cleanc` is included automatically (whether in-repo or submodule). When adding the dependency in workspaces, use `pnpm i -D cleanc` per project rule (no `pnpm add`).
- **tools/scripts**: No package.json; no clean script there. No change.

## Gaps and considerations (review)


| Area               | Consideration                                                                                                                                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path safety**    | Resolve each dir relative to cwd; normalize and ensure `path.relative(cwd, resolved)` does not start with `..` (or use `path.resolve(cwd, dir)` and ensure result is under cwd via realpath). Prevents accidental deletion outside the package. |
| **Turbo**          | Adding a `clean` task to turbo.json allows root to run `turbo run clean`; no `outputs` or `dependsOn` needed. Decide whether root `clean` script is `cleanc clean` (root only) or `turbo run clean` (all workspaces).                           |
| **Submodules**     | If [.gitmodules](.gitmodules) lists `packages/cleanc` (after repo rename), implement inside that repo; monorepo adds devDependency and scripts only.                                                                                            |
| **Standing todos** | Tracked in frontmatter `todos` (ids: tests, capture-knowledge, documentation, review-close). Complete or mark N/A with justification.                                                                                                           |


