# Quality Survey Visualizations

## Component Architecture

Each visualization is its own Svelte component (e.g. `CodecWinRateBarChart.svelte`, `PqLineChart.svelte`, `CodecMatchupHeatmap.svelte`). Components accept data as props and handle their own rendering.

## Snapshot Schema

**result_snapshots** table stores pre-aggregated scalar columns and JSON blobs:

- Scalar columns: `totalResponses`, `totalSessions`, `neitherRate`, `avgResponseTimeMs`, codec win rates, bitrate tiers, device/tier counts, headline matchups.
- JSON columns: `codecMatchupMatrix`, `bitrateGapConfidence`, `codecEquivalenceRatios`, `codecPqScores`, `transparencyThresholds`, `diminishingReturnsPoints`, `flacVsLossyWinRates`, `codecPqScoresByGenre`, `crossGenreQualityTradeoff`, `qualityVsContentByGap`.
- Page prefers snapshot data; falls back to `insights` when scalars are missing (legacy).

## Quality vs Content

`crossGenreQualityTradeoff` and `qualityVsContentByGap` are aggregated and stored but **not displayed** on the homepage yet. Wait until genre metadata is richer.

## Heatmap Value Convention

The shared `@vesta-cx/ui` Heatmap expects `value` in 0–1. For PQ (0–100), pass `value / 100` and use `label` for display (e.g. `"82.5%"`).
