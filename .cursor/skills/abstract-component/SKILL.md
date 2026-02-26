---
name: abstract-component
description: Scans a file for markup and scaffolding that can be extracted into components. Places reusable components in the UI package, app-specific ones in lib/components. Use when the user asks to abstract components, extract UI pieces, refactor markup into components, or when given a file to analyze for component extraction.
---

# Abstract Components from Markup

Identifies markup and scaffolding in a file that can be abstracted into components, then creates them in the correct location.

## Input

A file path (Svelte, Vue, React, etc.) to analyze. The user provides the path or the agent infers it from the current context.

## Placement Rules

| Condition | Destination |
|-----------|-------------|
| Reusable across apps (form controls, cards, layouts, toasts, dialogs) | `packages/ui/src/lib/components/` (if UI package exists) |
| App-specific (admin sidebar, survey player, domain forms) | `apps/<app>/src/lib/components/` |

When in doubt: if the abstraction would benefit another app in the monorepo, put it in the UI package.

## Patterns to Extract

Look for repeated markup or complex structures that would simplify the original file:

1. **Repeated markup** — Same structure used 2+ times; extract to a component with slots/props
2. **Form sections** — Label + input + helper text blocks that follow a pattern
3. **Layout scaffolding** — Card/panel borders, dialogs, modal structures with header/body/footer
4. **List items** — Expandable rows, complex nested forms

Avoid extracting single-use markup.

## Workflow

### 1. Read and analyze the file

- Parse the file for component boundaries
- Note: repeated patterns, logical sections, form groups, nested structures
- List candidate extractions with: name, purpose, props/slots needed

### 2. Decide placement for each candidate

- **UI package**: No app-specific logic, no app routes, no domain types
- **App lib/components**: Tied to app routes, domain entities, or app-only patterns

### 3. Create each component

1. Create the component file (kebab-case)
2. Extract the markup; add props/slots for variation
3. Add an `index.ts` if the package uses barrel exports
4. Replace inlining in the original file with the new component
5. Preserve accessibility (aria, roles), styles (Tailwind), and conventions

### 4. Verify

- Original file compiles and renders
- No regressions in behavior or styling
- Imports resolve correctly

## Naming Convention

- **File**: `kebab-case.svelte` (e.g., `upload-progress-toast.svelte`)
- **Component**: PascalCase export (e.g., `export { default as UploadProgressToast }`)
- **Folder**: Use when component has siblings or related files (e.g., `audio-player/audio-player.svelte`)

These follow the monorepo's file-naming conventions.

## Quick Checklist

- [ ] Placement: UI package (reusable) vs app-specific
- [ ] Props/slots are minimal and clear
- [ ] Original file compiles and renders correctly
- [ ] Exports added to index files (if the package uses barrels)
