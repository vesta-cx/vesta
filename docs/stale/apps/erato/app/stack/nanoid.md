---
title: ID Strategy (NanoID)
description: NanoID alphabet and rationale for Erato resource identifiers
---

# ID Strategy (NanoID)

Erato uses NanoIDs as primary resource identifiers.

Custom alphabet: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz`  
Numbers, uppercase, lowercase, and underscores, excluding ambiguous characters.

```js
import { customAlphabet } from "nanoid"

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz"
const nanoid = customAlphabet(alphabet, 12)

nanoid() // e.g. "eB_Jj8iGEJEZ"
```

Reference:

- [Why we chose NanoIDs for PlanetScale’s API](https://planetscale.com/blog/why-we-chose-nanoids-for-planetscales-api)
