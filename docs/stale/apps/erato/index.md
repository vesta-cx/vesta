---
title: Erato
authors:
  - name: Mia
    url: https://github.com/mia-riezebos
description: Backend REST API service for Vesta
created: 2025-10-13T12:36:40+02:00
modified: 2025-10-22T20:08:11+02:00
license:
license_url:
---

Erato is the backend REST API service for the Data Layer of Vesta. It exposes stable HTTP endpoints over the shared `packages/db` schema and handles API-layer concerns (validation, authz checks, pagination, error contracts, and versioning).

## Architecture

- [Erato Architecture & Data Access](./app/architecture.md)
- [Erato Stack Decisions](./app/stack/index.md)

## Scope

Erato docs focus on API concerns:

- route design and versioning
- request/response contracts
- auth/authz enforcement at the API boundary
- pagination, filtering, and sorting conventions
- service operations (error handling, observability, rollout)

## Data Model

The canonical data model docs now live with the shared schema package:

- [packages/db Data Model](../../packages/db/model/index.md)

Schema/domain docs are maintained in `packages/db`:

- [packages/db Data Model](../../packages/db/model/index.md)
- [packages/db](../../packages/db/index.md)

## Next Steps

- [Erato API Roadmap](./roadmap.md)
- [Erato Architecture & Data Access](./app/architecture.md)
- [Erato Stack Decisions](./app/stack/index.md)
