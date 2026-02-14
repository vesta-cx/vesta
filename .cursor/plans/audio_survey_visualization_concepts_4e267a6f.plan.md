---
name: Audio Survey Visualization Concepts
overview: An exhaustive inventory of every visualization concept mentioned in the audio survey database modeling research document, grouped by purpose and implementation context.
todos:
  - id: snapshot-schema
    content: Add result_snapshots schema with scalar columns (total_responses, neither_rate, codec win rates, bitrate tiers, device/comparison counts)
  - id: snapshot-aggregation
    content: Implement snapshot aggregation logic (compute from answers, TTL check, insert on expiry)
  - id: json-matrices
    content: Add JSON columns to snapshots (codec_matchup_matrix, bitrate_gap_confidence, codec_equivalence_ratios)
  - id: bradley-terry
    content: Implement Bradley-Terry model (JS) for PQ score derivation from pairwise comparisons
  - id: pq-json-columns
    content: Add PQ-related JSON columns (codec_pq_scores, transparency_thresholds, diminishing_returns_points)
  - id: flac-vs-lossy
    content: Add flac_vs_lossy_win_rates JSON column and aggregation logic
  - id: genre-metadata
    content: Expand source_files genre metadata and add more unique genres to sourceset (prerequisite for genre visualizations)
  - id: genre-pq-json
    content: Add codec_pq_scores_by_genre JSON column (requires genre metadata)
  - id: quality-vs-content
    content: Implement quality vs content preference (cross_genre_quality_tradeoff, quality_vs_content_by_gap) — do NOT enable on homepage yet
  - id: homepage-phase1
    content: Homepage visuals phase 1 — create components for overall stats, codec bar chart, bitrate tier chart, device distribution, headline matchups
  - id: homepage-phase2
    content: Homepage visuals phase 2 — create components for PQ line chart, heatmap, equivalence chart, FLAC vs lossy chart, scatter/stacked bar for neither
  - id: homepage-genre
    content: Enable genre visualizations — create components for confidence band, spaghetti plot, genre heatmap (when genre metadata is ready)
  - id: tests
    content: Write or update tests for the work done. Mark complete only after tests pass.
  - id: rules-skills
    content: Capture any new project knowledge as rules or skills. See Rules and Skills for triggers.
  - id: documentation
    content: Update relevant documentation if the change affects documented behavior, commands, or architecture.
  - id: review-close
    content: Review work for gaps, bugs, performance, conventions. Verify tests pass, app builds, rules/skills captured, docs updated.
isProject: false
---

# Audio Survey Visualization Concepts - Complete Inventory

Extracted from [audio survey database modeling.md](/Users/mia/vesta-cx/docs/content/Research/audio%20survey%20database%20modeling.md). Every visualization concept identified, segment by segment.

---

## Component Architecture

**Each visualization must be implemented as its own component.** Do not inline chart markup in page layouts. Create dedicated Svelte components (e.g. `CodecWinRateBarChart.svelte`, `PqLineChart.svelte`, `CodecMatchupHeatmap.svelte`) that accept data as props and handle their own rendering. This keeps the homepage composable, testable, and reusable.

---

## 1. Homepage / Dashboard Visualizations

**Source:** Lines 25, 1715-1786


| Concept                          | Description                                                                 | Data Source                                                  |
| -------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Overall stats display**        | total_responses, total_sessions, neither_rate, avg_response_time_ms         | result_snapshots scalar columns                              |
| **Codec win rate bar chart**     | Bar chart per codec (flac, opus, aac, mp3) with win rate + comparison count | flac_win_rate, opus_win_rate, etc. + _comparisons            |
| **Bitrate tier chart**           | "Does bitrate matter?" — win rates by tier (lossless, high, mid, low)       | bitrate_lossless_win_rate, bitrate_high_win_rate, etc.       |
| **Headline matchup stats**       | Key comparisons: lossless vs lossy, opus vs mp3, aac vs mp3                 | lossless_vs_lossy_*, opus_vs_mp3_*                           |
| **Device distribution**          | Participation breakdown by device type and price tier                       | device_headphones_count, device_speakers_count, tier_*_count |
| **Comparison type distribution** | Gap analysis: same_gapless, same_gap, different_gapless, different_gap      | comparison_*_count columns                                   |


---

## 2. Cross-Codec Bitrate Comparison (3-Axis Problem)

**Source:** Lines 1894-2017

### Heatmap

- **Purpose:** Opus vs MP3 (and other codec pairs) across bitrate combinations
- **Layout:** Rows = Opus bitrate (64–256), Columns = MP3 bitrate (128–320)
- **Cell value:** Win rate (e.g., 35%, 72%, 94%)
- **Color scale:** Green (opus wins) → Yellow (50/50) → Red (mp3 wins)
- **Key insight:** Diagonal = same-bitrate; "50% line" reveals equivalence points (e.g., Opus@128 ≈ MP3@192)
- **Data:** `codec_matchup_matrix` JSON or `matchup_snapshots` table

### Equivalence line / chart

- **Purpose:** "At what lower bitrate does opus stop clearly winning out over mp3?"
- **Format:** Line graph showing codec efficiency ratio
- **Example points:** Opus 64 ≈ MP3 96, Opus 128 ≈ MP3 192, Opus 192 ≈ MP3 280
- **Data:** `codec_equivalence_ratios` JSON (e.g., opus_vs_mp3: 1.4)

---

## 3. Close Bitrate vs "Neither" (Uncertainty)

**Source:** Lines 1899, 1948-1975

### Scatter plot

- **X-axis:** Bitrate difference (absolute value, kbps)
- **Y-axis:** "Neither" rate
- **Insight:** Closer bitrates → more uncertainty
- **Data:** `bitrate_gap_confidence` JSON (neither_rate by bitrate difference tier)

### Stacked bar by bitrate gap

- **Segments:** A wins | Neither | B wins
- **Grouping:** By bitrate gap tier (0–32, 64, 128, 192+ kbps)
- **Insight:** 0–32 kbps = high uncertainty; 192+ = clear preferences

---

## 4. Perceptual Quality (PQ) Curves

**Source:** Lines 2207-2322, 2227-2252

### Unified PQ line chart

- **Y-axis:** PQ score (0–100%)
- **X-axis:** Bitrate (kbps)
- **One line per codec:** FLAC (flat ~100%), OPUS, AAC, MP3
- **Interactions:**
  - Horizontal line at PQ → see equivalent configs (opus@128 ≈ aac@160 ≈ mp3@220)
  - Curve flattening → diminishing returns
  - Curve near 100% → transparency threshold (indistinguishable from lossless)
- **Data:** `codec_pq_scores` JSON, `transparency_thresholds`, `diminishing_returns_points`

### Goal-to-visualization mapping


| Goal                          | Visualization                 | Derived metric                     |
| ----------------------------- | ----------------------------- | ---------------------------------- |
| Diminishing returns per codec | Line chart, slope flattens    | Bitrate where ΔPQ < 2% per 32 kbps |
| Cross-codec equivalence       | Horizontal line intersections | PQ score equality                  |
| Transparency threshold        | Line approaches 100%          | Bitrate where PQ > 95%             |
| Optimal streaming bitrate     | Sweet spot on curve           | Best PQ/bitrate ratio              |


---

## 5. Genre-Segmented PQ Curves

**Source:** Lines 2582-2648

### Confidence band / ribbon

- **Concept:** Single PQ line becomes a band showing genre variance
- **Thick band** = more genre-dependent; **thin band** = consistent across genres
- **Data:** `codec_pq_scores_by_genre` JSON → compute band as max − min per codec+bitrate

### Spaghetti plot

- **Concept:** One line per genre, same codec
- **Example:** OPUS — Classical (most revealing), Electronic, Jazz, Hip-Hop (most forgiving)
- **Insight:** Which genres are most "codec-demanding"

### Heatmap: Genre × Codec × Bitrate

- **Rows:** e.g., OPUS@128, OPUS@192, AAC@128
- **Columns:** Classical, Electronic, Jazz, Hip-Hop
- **Cell:** PQ % per genre
- **Example:** OPUS@128 = 82% classical, 91% electronic, 85% jazz, 93% hip-hop

---

## 6. FLAC vs Lossy (Inverse Lossless)

**Source:** Lines 2694-2742

### FLAC win rate line chart

- **Y-axis:** FLAC win rate (0–100%)
- **X-axis:** Lossy bitrate (kbps)
- **One line per codec:** MP3, AAC, OPUS
- **50% line:** Transparency threshold (coin flip = can't tell)
- **Below 50%:** Lossy wins more often — codec coloration preferred
- **Data:** `flac_vs_lossy_win_rates` JSON

---

## 7. Quality vs Content Preference

**Source:** Lines 2670-2752, 2784-2865

> **Implementation note:** Implement the aggregation logic and store `cross_genre_quality_tradeoff` / `quality_vs_content_by_gap` in snapshots, but **do not enable this on the homepage yet**. Wait until extra genre metadata and more unique genres are added to the sourceset — otherwise the analysis will be too sparse or misleading.

### Content preference impact

- **Concept:** Compare expected outcome (same-song PQ) vs actual (different-song) → delta = content preference influence
- **Visualization:** Aggregate metric or bar/line showing delta by bitrate gap
- **Example:** "Content preference accounts for ~23% variance at this quality gap"

### Quality vs content by gap

- **X-axis:** Bitrate gap (32, 64, 128, 192 kbps)
- **Y-axis:** quality_wins vs content_wins ratio
- **Crossover point:** Where quality starts dominating (e.g., 128 kbps gap)
- **Data:** `quality_vs_content_by_gap` JSON

---

## 8. Schema / Conceptual Diagrams (ASCII)

**Source:** Lines 577-586, 600-608, 829-851, 1029-1054, 1156-1166, 2745-2759, 2854-2878


| Diagram                         | Purpose                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| **Composite FK diagram**        | codec_configs ↔ candidate_files (PK/FK relationship)                                   |
| **Normalized vs denormalized**  | survey_answers with/without device_category — join vs no-join                          |
| **Single query result table**   | answerId, selected, codecA, bitrateA, songA, codecB, bitrateB, songB, deviceCategory   |
| **A/B/Neither column options**  | candidateAId/candidateBId/selected vs selectedCandidateId/otherCandidateId             |
| **Answer segmentation flow**    | ALL ANSWERS → same_gapless/same_gap (Bradley-Terry) vs different_* (tradeoff analysis) |
| **Streaming platform pipeline** | User upload → AI genre + survey findings → optimal encoding selection                  |


---

## 9. Stored Data Structures (JSON) That Feed Visualizations

**Source:** Lines 2154-2188, 2639-2647, 2718-2736, 2704-2714

- `codec_matchup_matrix` — Heatmap data (opus_vs_mp3: { "64_128": { a_wins, b_wins, neither }, ... })
- `bitrate_gap_confidence` — Scatter/stacked bar (0_32, 33_64, etc. → neither_rate, sample_size)
- `codec_equivalence_ratios` — Equivalence line (opus_vs_mp3: 1.42)
- `codec_pq_scores` — PQ curves
- `codec_pq_scores_by_genre` — Genre bands/spaghetti/heatmap
- `transparency_thresholds` — Per-codec bitrate at PQ > 95%
- `diminishing_returns_points` — Per-codec bitrate where slope drops
- `flac_vs_lossy_win_rates` — FLAC win rate by codec and bitrate
- `cross_genre_quality_tradeoff` / `quality_vs_content_by_gap` — Content vs quality tradeoff

---

## Summary: Visualization Count by Type


| Type                        | Count                                                 |
| --------------------------- | ----------------------------------------------------- |
| Bar charts                  | 2 (codec win rates, bitrate tiers)                    |
| Line charts                 | 5+ (PQ curves, equivalence, FLAC vs lossy, spaghetti) |
| Heatmaps                    | 2 (codec×bitrate, genre×codec×bitrate)                |
| Scatter plots               | 1                                                     |
| Stacked bars                | 1                                                     |
| Confidence bands / ribbons  | 1                                                     |
| Stats displays / breakdowns | 4                                                     |
| Conceptual/flow diagrams    | 6                                                     |


**Total:** 22+ distinct visualization concepts, plus 9 JSON data structures and 6 ASCII schema/flow diagrams.