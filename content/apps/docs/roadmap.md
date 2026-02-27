---
title: Docs App Roadmap
description: Roadmap for improving docs authoring and developer experience in apps/docs
---

# Docs App Roadmap

This roadmap tracks improvements for the docs app itself (`apps/docs`), with priority on authoring ergonomics and better source traceability.

## TODO

- [ ] **Auto-link source paths to GitHub (priority 1).**
  - Build a small parser/transform that detects source-style references in markdown, such as:
    - ``packages/utils/src/auth/handle.ts``
    - `@apps/docs/content/packages/utils/auth/handle.md:8`
  - Convert matched paths into GitHub blob links in deployed docs.
  - Line numbers should map to anchors (for example: `#L8`).
  - Resolve repository URL + branch from config/env so links are environment-safe.
  - Skip transformation for already-linked markdown URLs.

## Notes

- Suggested implementation point: docs markdown pipeline (remark/rehype transform) so authors can keep writing plain path references.
- Initial target patterns:
  - `apps/...`
  - `packages/...`
  - Optional `:<line>` suffix
