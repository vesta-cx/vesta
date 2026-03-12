---
title: Database Strategy (D1 vs PlanetScale)
description: Current D1 choice and future migration criteria for Erato
---

# Database Strategy (D1 vs PlanetScale)

## Current

Use Cloudflare D1 during current phases for speed of iteration and low operational overhead.

## Why D1 Now

- Native fit with Workers runtime.
- Good enough performance for current scale and direct-binding development model.
- Simpler infrastructure while API contracts are still stabilizing.

## Why Consider PlanetScale Later

- Larger-scale operational controls and ecosystem tooling.
- Better fit when Erato is a strict HTTP boundary for multiple clients.
- Migration path exists because schema is centralized in `packages/db`.

## Transition Trigger (Example)

Revisit DB choice when one or more are true:

- sustained high query volume where D1 profile becomes limiting
- stricter operational requirements around scaling/throughput
- Erato becomes the primary API for multiple external/internal consumers
