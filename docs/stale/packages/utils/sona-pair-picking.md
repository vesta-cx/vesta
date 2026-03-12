# Sona pair-picking flow

## Config shape

- **Pairing weights**: `{ same_song, different_song }` only. Placebo is separate.
- **Placebo**: Admin-controlled probability (0–1). Rolled after picking same_song vs different_song.
- **Permutation weights**: Keyed by `codec_bitrate` (e.g. `flac_0`, `opus_128`). Used for weighted pick from quality pool.
- **Transition weights**: gapless, gap_continue, gap_restart, gap_pause_resume.
- **Mode weights**: codec_compare, bitrate_battle, genre_trials, tradeoff — for Mixtape mode pick.

## Tradeoff mode (future)

- `effectiveBitrate(codec, bitrate)`: FLAC → 1411 kbps, else actual bitrate.
- Gap: `|log2(effA) - log2(effB)|`. Target gap from configured PDF (control points or skew).

## enabledPairing

User setting: `['same_song']` or `['same_song', 'different_song']`. Placebo is never in this list.
