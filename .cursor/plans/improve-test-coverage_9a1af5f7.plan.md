---
name: improve-test-coverage
overview: "Increase test coverage through a phased rollout: baseline measurement, package-level thresholds, targeted test additions, and CI gating. Focus on high-value packages first to improve confidence quickly without blocking development."
todos:
  - id: baseline
    content: Capture current coverage baselines for priority packages and record by metric (lines/functions/branches/statements).
    status: pending
  - id: thresholds
    content: Add package-specific Vitest coverage thresholds based on baseline and maturity; include justified excludes.
    status: pending
  - id: targeted-tests
    content: Write targeted tests for highest-risk logic paths (Erato routes/auth, storage providers, cleanc runtime/config, query-factory parsers).
    status: pending
  - id: ci-gate
    content: Add Turbo/CI coverage tasks so regressions fail consistently in pull requests.
    status: pending
  - id: tests-standing
    content: "Tests — Required: run updated coverage suites and confirm they pass after threshold changes."
    status: pending
  - id: rules-skills-standing
    content: "Rules & skills — Required: capture any repeatable coverage workflow (e.g., threshold ratcheting + package onboarding) as a skill/rule if this process is adopted."
    status: pending
  - id: docs-standing
    content: "Documentation — Required: document coverage commands, threshold policy, and ratchet cadence in project docs/README sections."
    status: pending
  - id: review-close-standing
    content: "Review & close — Required: verify no accidental excludes, confirm conventions, and identify next threshold increment opportunities."
    status: pending
isProject: false
---

<!-- @format -->

# Improve Test Coverage Incrementally

## Current State (from repo scan)

- Coverage commands exist in several packages (`test:coverage`), but threshold enforcement is missing in Vitest configs:
  - [packages/cleanc/vitest.config.ts](/Users/mia/vesta-cx/vesta/packages/cleanc/vitest.config.ts)
  - [packages/storage/vitest.config.ts](/Users/mia/vesta-cx/vesta/packages/storage/vitest.config.ts)
  - [packages/utils/vitest.config.ts](/Users/mia/vesta-cx/vesta/packages/utils/vitest.config.ts)
  - [packages/drizzle-query-factory/vitest.config.ts](/Users/mia/vesta-cx/vesta/packages/drizzle-query-factory/vitest.config.ts)
  - [apps/erato/vitest.config.ts](/Users/mia/vesta-cx/vesta/apps/erato/vitest.config.ts)
- Monorepo root has no centralized test/coverage task orchestration in [turbo.json](/Users/mia/vesta-cx/vesta/turbo.json).

## Proposed Rollout

1. **Baseline first (no breakage):** Run `test:coverage` in key packages and capture current percentages (lines/functions/branches/statements).
2. **Set realistic package thresholds:** Add per-package `coverage.thresholds` at/just below current baseline (or a small floor such as 35-50% depending on package maturity), then ratchet up over time.
3. **Prioritize high-impact test targets:** Add tests where risk is highest and logic is dense (route handlers/middleware, parsers, edge cases, error paths).
4. **Add a monorepo coverage gate:** Wire `test`/`test:coverage` into Turbo so CI can run coverage checks predictably.
5. **Ratchet policy:** Increase thresholds in small steps (e.g., +3 to +5 points every sprint) instead of one aggressive jump.

## High-ROI Targets

- `apps/erato/src/routes` and auth utilities (behavioral edge cases + error handling)
- `packages/storage/src` provider behavior and failure paths
- `packages/cleanc/src` command/config handling edge cases
- `packages/drizzle-query-factory/tests` for query parsing/operator permutations

## Guardrails

- Exclude generated files, type-only barrels, and schema/index entrypoints from thresholds when appropriate.
- Keep thresholds package-scoped to avoid punishing smaller legacy modules.
- Prefer fast unit tests first; keep E2E targeted and minimal.

## Example Threshold Pattern (to apply per package)

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "html", "json-summary"],
  thresholds: {
    lines: 55,
    functions: 55,
    branches: 45,
    statements: 55,
  },
}
```

## Success Criteria

- Every actively maintained package has `test:coverage` plus thresholds.
- CI fails on threshold regressions.
- Trend shows threshold ratcheting upward over time, not one-off spikes.
