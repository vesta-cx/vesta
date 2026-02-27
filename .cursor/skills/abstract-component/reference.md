<!-- @format -->

# Abstract Component — Reference

## UI Package vs App Components

### UI Package (`packages/ui/src/lib/components/`)

Suitable when:

- No imports from app routes, server modules, or app config
- No domain-specific types (e.g. `TrackEntry`, `SourceFile`)
- Can be styled by theme tokens / Tailwind
- Likely reused in another app

Examples: Button, Card, Dialog, FormField, Toast, Section, Header

### App Components (`apps/<app>/src/lib/components/`)

Suitable when:

- Uses app routes, load data, or server modules
- Wired to domain entities
- Implements app-specific flows (admin sidebar, survey setup)

Examples: AdminSidebar, UploadProgressToast, SurveyPlayer, SourceEditor

## Extraction Patterns

### Form section

```svelte
<!-- Before: repeated in file -->
<div class="space-y-2">
  <label for="license_url" class="text-sm font-medium">License URL</label>
  <input id="license_url" name="license_url" type="url" ... />
  <p class="text-muted-foreground text-xs">Applied to all tracks.</p>
</div>
```

→ `FormField` or `FormSection` in UI package with `label`, `hint` slots

### Expandable card row

```svelte
<!-- Before: in #each -->
<button type="button" onclick={() => (item.expanded = !item.expanded)}>
  <span>{item.title}</span>
  <span>{item.expanded ? '−' : '+'}</span>
</button>
{#if item.expanded}
  <div class="mt-3 grid gap-3">...</div>
{/if}
```

→ `ExpandableRow` or `AccordionItem` in UI package (if generic) or app component (if domain-bound)

### Action button group

```svelte
<div class="flex gap-2">
  <button class="...">Submit</button>
  <button type="button" class="...">Cancel</button>
</div>
```

→ `ButtonGroup` or use existing `Button` with variant; only extract if the pattern repeats with same structure

## Monorepo Structure (Vesta/mia-cx)

```
packages/ui/src/lib/
  components/
    ui/           # shadcn-style primitives
    layout/       # Section, Header, Footer
    utils/        # CookieConsent, GradientBlur

apps/<app>/src/lib/
  components/     # App-specific: AdminSidebar, UploadProgressToast
```
