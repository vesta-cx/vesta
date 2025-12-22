---
title:
authors:
description:
created: 2025-10-24T13:08:44+02:00
modified: 2025-10-24T13:20:20+02:00
license:
license_url:
---

Erato will use NanoIDs as the primary resource identifier. The main reason why is because I personally think they look nice, but other reasons can be found on [this article](https://planetscale.com/blog/why-we-chose-nanoids-for-planetscales-api) by PlanetScale.[^1]

Custom alphabet: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz`  
numbers, uppercase, lowercase and underscores, excluding "ambiguous" characters as per Bitwarden.[^2]

```js title="nanoid.ts"
import { customAlphabet } from 'nanoid'
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ_abcdefghijkmnopqrstuvwxyz'
const nanoid = customAlphabet(alphabet, 12)
nanoid() //=> "eB_Jj8iGEJEZ"
```

[^1]: [Why we chose NanoIDs for PlanetScale’s API — PlanetScale](https://planetscale.com/blog/why-we-chose-nanoids-for-planetscales-api)
[^2]: Ambiguous characters - <https://community.bitwarden.com/t/list-of-ambiguous-characters-in-the-password-generator/61585/2>
