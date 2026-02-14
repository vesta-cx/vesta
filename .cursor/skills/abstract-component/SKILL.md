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

## Patterns to Look For

1. **Repeated markup** — Same structure used 2+ times; extract to a component with slots/props
2. **Form sections** — Label + input + helper text blocks that follow a pattern
3. **Card/panel layouts** — Bordered containers with header, body, actions
4. **Button/action groups** — Repeated button rows with similar styling
5. **List items** — Complex list-item markup (e.g. expandable rows with nested forms)
6. **Dialog/modal scaffolding** — Title, content, footer with confirm/cancel
7. **Loading/empty states** — Skeleton or placeholder blocks
8. **Toast/notification patterns** — Custom toast layouts

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

## Naming

- **Component file**: `kebab-case.svelte` (e.g. `upload-progress-toast.svelte`)
- **Component name**: PascalCase (e.g. `UploadProgressToast`)
- **Folder**: Match the component when it has siblings (e.g. `audio-player/` with `audio-player.svelte`)

## Quick Checklist

- [ ] No app-specific routes or domain types in UI package components
- [ ] Props and slots are minimal and clear
- [ ] Original file uses the new component(s)
- [ ] Exports added to index files if the package uses barrels

## Additional Resources

- For detailed patterns and monorepo structure, see [reference.md](reference.md)
