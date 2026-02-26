---
title: MusicBrainz Integration
authors:
description: Integration with MusicBrainz for release and artist metadata sync. Opt-in submission via pre-seeded forms.
created:
modified:
tags:
  - musicbrainz
  - metadata
  - roadmap
---

## Overview

A MusicBrainz helper so artists can sync release metadata to MusicBrainz. Part of broader [metadata providers strategy](./metadata-providers.md) (MusicBrainz, Discogs, Last.fm). Adds incentive for artists and collectors (canonical IDs, discoverability). Uses form seeding (Picard-style) — no OAuth for edits. Users submit on MusicBrainz; we prefill the form.

---

## Constraints

- **No creating artists on MB via Vesta** — If artist doesn't exist on MusicBrainz, user creates on MB directly. Vesta only links to existing MB artists.
- **Public releases only** — "Submit to MusicBrainz" available only for public releases, not private or unlisted.
- **Artist must be linked** — User must link their Vesta artist profile to an MB artist before submitting. If not on MB, they create one first (on MusicBrainz).
- **Uniqueness check** — Before add, search MB for releases under linked artist. User must confirm the release doesn't exist. Must explicitly dismiss any fuzzy matches to confirm it's a unique release.

---

## Add Release Flow

1. User uploads on Vesta, turns on "Submit to MusicBrainz" switch.
2. Upload finishes. Prerequisites checked: artist linked to MB, release is public, uniqueness confirmed (no match or fuzzy matches dismissed).
3. User clicks "Open in MusicBrainz."
4. Vesta builds a hidden form: `action="https://musicbrainz.org/release/add"`, `method="POST"`, `target="_blank"`. Seed params: `name`, `artist_credit.names.0.mbid`, `mediums.0.track.0.name`, etc. `edit_note`: "On behalf of &lt;artist&gt; — &lt;url to release on Vesta&gt;". `redirect_uri`: `https://vesta.app/releases/{id}/mb-callback`.
5. Form submits in new tab. User lands on MB release/add page with form prefilled.
6. User reviews, logs in if needed, submits on MusicBrainz.
7. MB redirects to `redirect_uri?release_mbid=<uuid>`.
8. Vesta callback page stores MBID on the release, shows success, offers "Close" (`window.close()`).
9. Original Vesta tab stays open. MBID is now linked to the release.

---

## Update Release Flow

- Release already has MBID. User edits metadata on Vesta, clicks "Update on MusicBrainz."
- Same pattern: form opens new tab targeting `https://musicbrainz.org/release/<mbid>/edit` with changed fields prefilled.
- User submits on MB; MB redirects back to callback. Flow identical to add.

---

## Artist Metadata Updates

When Vesta artist is linked to MB artist, user can update that artist's metadata on MB:

- Links (URLs)
- Disambiguation
- Relationships (e.g. label memberships if label linked)
- Aliases (add new alias, "end" the old one)
- Events

**Flow:** "Update artist on MusicBrainz" → open `https://musicbrainz.org/artist/<mbid>/edit` with seed query params. User reviews and submits on MB. Same pattern as release — no programmatic submit, user does it on MB.

---

## Technical Notes

| Aspect | Approach |
| ------ | -------- |
| **OAuth** | Not used for edits. MB OAuth scopes are limited (tags, ratings, ISRCs, barcodes). No scope for artist/release metadata edits. |
| **Release add** | POST form to `release/add` with seed params. See [Release Editor Seeding](https://wiki.musicbrainz.org/Development/Seeding/Release_Editor). |
| **Release edit** | GET `release/<mbid>/edit` with query params, or POST if supported. |
| **Artist edit** | GET `artist/<mbid>/edit` with query params (`edit-artist.disambiguation`, `edit-artist.url.0.text`, `rels.0.*`, etc.). See [Artist Editor Seeding](https://wiki.musicbrainz.org/Development/Seeding/Artist_Editor). |
| **Attribution** | `edit_note` on every submission: "On behalf of &lt;artist&gt; — &lt;vesta release url&gt;" |

---

## Package

- **@vesta-cx/musicbrainz** (or similar) — Lookup (search artist, search release, get by MBID), cover art, build seed params for release add/edit and artist edit forms. No submission — we generate form data; the browser POSTs/ navigates.
