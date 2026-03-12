---
title: Erato API Roadmap
description: Lightweight API TODOs for Erato
---

# Erato API Roadmap

This is a lightweight TODO roadmap for Erato as an API service.  
Schema evolution and data model docs live in `packages/db`.

## TODO

- [ ] Define `v1` route groups and baseline endpoint naming conventions. (#59)
- [ ] Standardize response envelope and error format across endpoints. (#60)
- [ ] Add pagination/filter/sort conventions for list endpoints. (#61)
- [ ] Implement auth + authorization middleware per route group. (#62)
- [ ] Document idempotency expectations for write endpoints. (#63)
- [ ] Add request validation strategy (shared validators/schemas). (#64)
- [ ] Add API observability baseline (request IDs, structured logs, latency metrics). (#65)
- [ ] Design messaging API surface (DMs and groups): threads, participants, membership roles, delivery/read events, and moderation hooks. (#67, deferred)
- [ ] Publish an initial endpoint catalog with ownership and status. (#66)
- [ ] Keep architecture/data-access docs updated as we move from direct D1 usage to Erato-first HTTP access.
