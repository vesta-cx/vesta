---
title: Workspace Custom Theming & Agentic Pipeline Roadmap
description: Long-term vision: (1) site-builder-style custom themes and layouts—visual editor + safe markup, no custom scripting—then (2) agentic coding on the platform via MCP, schemas, tools, rules, and skills.
---

# Workspace Custom Theming & Agentic Pipeline Roadmap

## Goal

Users build **powerful custom themes** for their workspaces and change layouts in a way that feels like a **basic site builder** (Wix, WordPress, etc.)—**without custom scripting**. They get **provided components** and **basic logic blocks** (e.g. loops, conditionals) that they compose with **placeholders** to extend the default look **visually** only. Editing happens in two ways: **(1) visually** in a “WYSIWYG webpage editor” UI (mouse-driven: drag, drop, click to edit) and **(2) in a custom markup language**—HTML-like but without JavaScript or features that create security or attack-surface risk. **After** this builder ships, we add **agentic coding on the platform**: schemas, tools, rules, skills, and an MCP server so AI can safely build and evolve themes and layouts using the same constraints.

## Phasing

| Phase | What | Notes |
| ----- | ---- | ----- |
| **A. Site-builder experience** | Visual editor + safe markup. Provided components, logic blocks, placeholders. No custom JS; no unsafe HTML/CSS. Users edit via canvas/editor and/or custom markup. | Primary long-term product goal. |
| **B. Agentic pipeline** | Schemas, tools, rules, skills, MCP server. AI creates/edits themes and layouts by calling the same builder primitives. | After Phase A. Same surface area and security model as human users. |

## Scope & expansion

The **built-in default theme is the reference**: it defines the initial component and logic-block set. We ship **only** what that theme needs—no large allowlist at launch. Users **request** components or blocks they need; we **expand the set gradually based on user demand**. New additions stay allowlisted and safe. This keeps v1 small and maintainable and ties growth to real use.

## Permissions & feature access

- **Who can edit.** Defined by **workspace permissions**. The **workspace owner can always edit** the theme/layout; other roles follow the same permission model.
- **Feature access.** Access to the theme/layout builder is behind a **subscription item**. Pricing TBA (need to figure out COO). See [Feature Catalog & Pricing Transparency](./feature-catalog.md).

## What users can do (building blocks)

| Area | Capability | Safety / constraints |
| ---- | ----------- | ---------------------- |
| **Theming** | Colors, fonts, spacing, radii (design tokens) | Token keys and allowed value shapes only (e.g. OKLCH, predefined scales). No raw HTML/CSS. |
| **Layout** | Layout template (single-column, grid, sidebar, etc.), reorder sections | Predefined template IDs only. No user-authored layout code. |
| **Components** | Enable/disable or swap components (e.g. hero style, post card variant) | Allowlist of component identifiers; all components are **mobile-first and accessible**. No custom component code. |
| **Logic blocks** | Basic “loop over object,” “if/else” building blocks composed with components | e.g. show all resources in a collection, or show a skeleton / “no content” screen when a value is null or false. See [Placeholders & stripped markup](#placeholders--stripped-markup). |
| **Copy / content** | Headlines, taglines, layout via stripped markup + placeholders | Sanitized text + [stripped markup](#placeholders--stripped-markup) (allowlisted tags, placeholders, custom elements for loops/conditionals). No user-authored JavaScript. |
| **Optional (future)** | Limited “custom block” (e.g. embed, styled block) | If added: strict CSP, allowlisted elements/attributes only; no script. |

**Safety principles:** No eval or arbitrary code. All user/AI content escaped or rendered through a safe subset; XSS prevention. Theme/layout changes attributable and revertible (workspace settings + optional history).

## Editing modes: Visual + Markup

- **Visual (webpage editor).** Mouse-driven editing: select elements, drag and drop components, reorder sections, edit copy in place, adjust tokens (e.g. color picker bound to design tokens). The editor reads and writes the **same** underlying representation (theme config, layout tree, copy with placeholders) as the markup. For **JIT WYSIWYG**, the **client** renders what’s being built in the editor so changes appear live; prod is server-rendered and cached (see [Gaps & ideas](#gaps--ideas-to-consider)).
- **Markup.** Users can edit the same theme/layout in the custom markup language. Visual and markup stay in sync. Supports power users and, in Phase B, agentic editing (AI produces markup or calls tools that update the same structures).

## Placeholders & stripped markup

A **Liquid-style** notion plus a **stripped markup language**: HTML- and CSS-like, with placeholder parsing and custom elements for looping and conditionals—**no user-authored JavaScript**.

### Placeholders

- **Variables and filters.** e.g. `Hello, {{ user.display_name }}` or `{{ collection.title | default: "My collection" }}`. Resolved from a **fixed context** (user, workspace, collection, post, link, etc.) and **allowlisted filters** (e.g. `default`, `truncate`, `date`). No custom logic.
- **Fixed context schema.** Only defined objects and properties (e.g. `user.id`, `user.display_name`, `collection.title`, `collection.item_count`, `post.published_at`). No arbitrary property access.

### Stripped markup (HTML-like + custom elements)

- **Allowlisted HTML-like tags.** Small subset (e.g. `div`, `span`, `p`, `a`, `ul`, `li`, `section`, `header`). No `script`, `iframe`; allowlisted attributes (`class`, safe `href`, `aria-*`). Content and attributes escaped or validated; placeholders resolved before output.
- **Logic blocks (custom elements for control flow).** Basic “loop over object” and “if/else” building blocks only. Users compose them with components to e.g. show all resources in a collection, or show a skeleton or “no content” screen when a value is null or false. Our elements only: e.g. **loop** (`<foreach items="{{ collection.items }}">…</foreach>`), **conditionals** (`<if condition="…">…</if>`). Each binds to a fixed context property; no user-defined components or arbitrary tags.
- **Optional: constrained CSS.** If we allow user style: token refs (`var(--token-name)`), allowlisted properties only, no `url()` except allowlisted domains, no `expression()` or script. Alternatively, style is design tokens and layout templates only—no raw user CSS.

**Safety:** Declarative only; server-side or sandboxed renderer; no user JS; output escaped. Same XSS/injection guarantees as the rest of the pipeline.

**Invalid markup:** If markup fails to parse, the user **cannot push to prod**. They **can save as draft** and fix errors before publishing.

## Phase B: Agentic coding on the platform

**After** the site-builder is in place:

- **MCP server.** Tools map to builder primitives: `set_theme_tokens`, `set_layout`, `set_component_options`, `set_copy` (with placeholders and stripped markup). Resources expose current theme/layout state. Server validates all inputs and rejects out-of-scope requests—single place that decides what is safe to ship.
- **Schemas.** Document context and markup (placeholder variables, allowlisted tags, custom elements) so AI and tooling share one contract.
- **Rules & skills.** Agent-facing guidance and workflows for “edit theme,” “add section,” “change layout,” etc., so agentic coding stays within the builder’s surface area.

## Non-goals

- Implementing the builder or agentic pipeline now; this doc is **vision and roadmap only**.
- Arbitrary custom components or user-authored JavaScript.
- Plugins or third-party code execution in creator workspaces.

## When to implement

- **Phase A:** After **Milestone 1** (and likely later milestones)—when core theming is data-driven, we have a clear schema for workspace theme/layout/config, and we can invest in the visual editor, markup renderer, and sanitization. Component/block set is default-theme-only at launch; expand from user requests.
- **Phase B:** After Phase A is live. Schemas, MCP server, tools, rules, and skills build on the same primitives.

## Gaps & ideas to consider

- **Draft vs live.** Theme/layout can be saved as draft; only valid (parseable) markup can be pushed to prod. Invalid markup blocks push but allows save as draft (see [Placeholders & stripped markup](#placeholders--stripped-markup)).
- **Request mechanism.** How users request new components/blocks (feature request form, voting, support)—one explicit path so “expand from user demand” is actionable.
- **Version history / undo.** Beyond “revertible”: explicit version history or undo so users can compare or roll back. One approach: **power history with Git** (theme/layout as files in a repo), and **keep only the prod version in the DB** for serving; history lives in the repo.
- **Accessibility.** Default theme and user customizations should preserve a11y (contrast, focus, semantics). Consider documenting as a constraint (e.g. token/component choices must meet minimum contrast) or as a non-goal to revisit.
- **Responsive behavior.** Builder UI may be desktop-first; output (themes) should be responsive. Clarify that the default theme and custom layouts are expected to work across viewports.
- **Documentation.** Phase A needs clear docs for the placeholder syntax, allowlisted tags, and custom elements so users (and later AI) can author markup confidently. The docs stack will be a **Svelte rewrite of Quartz** before we get to this; that work comes first.
- **Renderer placement & caching.** **Prod:** server renders and caches the markup; cache miss via **version number**, **git HEAD**, or **hash of source**. **Editor:** client renders what’s being built for **JIT WYSIWYG** so edits appear live in the canvas.

## See also

- [Milestone 1 Roadmap (Blogging + Smart Links)](./milestones.md) — Creator identity, theming in scope
- [Feature Catalog & Pricing Transparency](./feature-catalog.md) — Theming and AI-assisted customization tiers
- [Development Checklist (Phase 1)](./development-checklist.md) — PR and security practices
