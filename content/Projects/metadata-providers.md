---
title: Metadata Providers Strategy
authors:
description: Music metadata integrations — MusicBrainz, Discogs, Last.fm. What we integrate and why.
created:
modified:
tags:
  - metadata
  - musicbrainz
  - discogs
  - lastfm
  - roadmap
---

## Overview

| Provider                | Status  | Use case                                                                                         |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| **MusicBrainz**         | Primary | Canonical IDs, release/artist sync. See [MusicBrainz Integration](./musicbrainz-integration.md). |
| **Discogs**             | Planned | Collectors, physical media, alternative release IDs. Complement to MusicBrainz.                  |
| **Last.fm**             | Planned | **Full scrobbling support.** Listen history, tags, discovery.                                    |
| **RYM / Sonemic**       | No      | No public API — skip.                                                                            |
| **Streaming platforms** | Later   | If/when Vesta adds a distribution service.                                                       |
| **Wikidata**            | No      | Less relevant to music; skip.                                                                    |

## Last.fm

Full scrobbling support in Vesta. Scrobble when user plays (stream, offline, local). Last.fm API for auth (OAuth) and submit. Enhances user profiles, recommendations, social features.

## Discogs

Similar pattern to MusicBrainz: lookup, link releases, optional sync. Strong for vinyl/collectors. API available. Integrate after MusicBrainz is stable.
