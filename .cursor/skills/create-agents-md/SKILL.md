---
name: create-agents-md
description: >-
  Create or update AGENTS.md files for projects. Audits a monorepo or codebase,
  identifies cross-project conventions, and produces a structured AGENTS.md that
  guides AI agent behavior. Use when the user wants to create AGENTS.md, set up
  agent rules, bootstrap a new project's AI context, or improve existing agent
  instructions.
---

# Create AGENTS.md

Build an AGENTS.md file that gives AI coding agents the context they need to work correctly in a project.

## Audit Methodology

Before writing anything, gather evidence:

1. **Read the project structure.** `package.json`, `tsconfig.json`, config files, directory layout. Understand what tools are in play.
2. **Cross-reference existing projects.** If the user has other repos in the workspace, compare conventions. Shared patterns across projects are strong candidates for rules.
3. **Check for non-obvious conventions.** Look for patterns an agent would likely get wrong without being told:
   - Color spaces (OKLCH vs hex vs HSL)
   - Theme mechanisms (data attributes vs CSS classes)
   - Component export patterns
   - Import aliases and path mappings
   - State management choices (runes vs stores, nanostores vs context)
   - Environment variable naming conventions
4. **Identify what tooling already enforces.** Prettier config, ESLint rules, lint-staged — these don't need rules. The agent just needs to not fight them.

## Inclusion Criteria

For each potential rule, ask: **"Would the agent likely get this wrong without it?"**

- **Include**: Non-obvious conventions, project-specific patterns, architectural decisions, things where the "obvious" default is wrong for this project.
- **Exclude**: Standard practices the agent already knows (e.g., `workspace:*` in pnpm monorepos), things enforced by tooling (prettier/eslint), and conventions that don't exist yet (don't invent rules the user hasn't established).

## Section Structure

Use this structure, dropping sections that don't apply:

```markdown
## Approach

<!-- How to interact: plan-first vs dive-in, mode preferences -->

## Problem-Solving Protocol

### Before Writing Code

### When Debugging

### When Building Features

### Testing & Verification

<!-- Optional: Dependabot / Security Branches if relevant -->

## Workspace Conventions

### Standard Project Shape

### New Project Setup

### Adding an App

### Rules and Skills

## Technology Preferences

### Frontend

### Backend & Data

### Tooling

## Coding Conventions

### UI Library Conventions (if applicable)

## Communication

## Long Conversations

## Reference Links

<!-- Direct doc URLs the agent should fetch instead of web searching -->
```

## Writing Guidelines

- **Positive directives over negatives.** "Use OKLCH" > "Don't use hex." (Negative language makes models fixate on the forbidden action.)
- **Concrete examples beat abstractions.** `oklch(0.141 0.005 285.823)` > "use OKLCH format." `[data-theme='dark']` > "use data attributes."
- **One convention per line in lists.** Bold the keyword, dash-separated rule. Scannable format.
- **Reference Links as a table.** Direct doc URLs agents should fetch instead of web searching.

For project-specific guidance: call out what agents would likely misinterpret (e.g., color spaces, state management patterns, environment variable prefixes).

## Process

1. **Audit** — Read project files, cross-reference repos, gather evidence.
2. **Draft** — Write the AGENTS.md following the section structure.
3. **Review with user** — Walk through what you included and why. Flag gaps (e.g., "no error handling convention found — want to establish one?").
4. **Iterate** — Refine based on feedback. This is rarely one-shot.
