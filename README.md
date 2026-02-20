# Erato

Erato is the database app for canvas.

## Music metadata schema (reference)

Notes for a fully fledged music metadata DB schema. More will follow.

### Track label display format

**Single-line** (default):

```
<main_artists> — <song_title> <featured_artists> <remix_artists>
```

**Multiline** (when vertical space is preferred):

```
<song_title> <remix_artists>
<main_artists> <featured_artists>
```

Element formatting (same for both):
- **main_artists**: `artist1, artist2 & artist3` (comma-separated; last two joined with ` & `)
- **song_title**: Literal string, the track title
- **featured_artists**: `(feat. artist4, artist5 & artist6)` — includes parentheses
- **remix_artists**: `(artist7, artist8 & artist9 Remix)` — includes parentheses

### Storage format (semicolon-separated)

All artist lists (main, featured, remix) stored as semicolon-separated: `"Artist A; Artist B"`.

Use `\;` to escape semicolons in artist names, `\\` for backslashes.
