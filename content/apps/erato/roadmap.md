---
title: Erato API Roadmap
description: Lightweight API TODOs for Erato
---

# Erato API Roadmap

This is a lightweight TODO roadmap for Erato as an API service.  
Schema evolution and data model docs live in `packages/db`.

## TODO

- [ ] Define `v1` route groups and baseline endpoint naming conventions.
- [ ] Standardize response envelope and error format across endpoints.
- [ ] Add pagination/filter/sort conventions for list endpoints.
- [ ] Implement auth + authorization middleware per route group.
- [ ] Document idempotency expectations for write endpoints.
- [ ] Add request validation strategy (shared validators/schemas).
- [ ] Add API observability baseline (request IDs, structured logs, latency metrics).
- [ ] Publish an initial endpoint catalog with ownership and status.
- [ ] Keep architecture/data-access docs updated as we move from direct D1 usage to Erato-first HTTP access.
