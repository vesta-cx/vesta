---
title: Sona — Audio Quality Survey
authors:
description: Online survey to gauge codec and bitrate perception across genres
created: 2025-10-30T23:21:32+01:00
modified: 2025-10-31T00:06:35+01:00
license:
license_url:
---

Sona is an A|B survey application to gather data-driven insights on audio codec and bitrate perception. Users compare audio samples across different codecs, bitrates, and genres to determine Vesta's optimal streaming quality options.

## Survey Scope

- **Codecs tested** — FLAC (lossless), Opus, MP3, AAC, and other candidates
- **Bitrate tiers** — Multiple bitrate options per codec
- **Genres** — Different music genres (to control for perception variation)
- **Playback conditions** — Gapless vs. gap-separated playback

## Results

- **Personal results** — Stored client-side (browser localStorage) until Vesta authentication is available
- **Global results** — Aggregated survey data across all participants
- **Analytics** — Codec win rates, bitrate thresholds, genre-specific perception

## User Interface

### A|B Comparison

- **"Would you rather" format** — Users select their preference between two audio samples
- **Multiple rounds** — Random permutations or configurable count

### Keyboard Controls

| Key | Action |
| --- | --- |
| Left/Right Arrow | Select left/right answer |
| Up/Down Arrow | Volume control |
| J | Seek back (–10s) |
| K | Play/pause |
| L | Seek forward (+10s) |
| Space | Commit answer and move to next |

## Data Model

Results are aggregated using the **Bradley-Terry model** for pairwise comparisons. See [sources](./sources%20used%20in%20researching%20for%20this%20app.md).
