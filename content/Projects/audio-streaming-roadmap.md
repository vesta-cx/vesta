---
title: Audio Streaming Roadmap
authors:
description: Roadmap for chunked CMAF audio streaming via HLS. Cast/AirPlay support. Custom WAAPI pipeline deferred.
created:
modified:
tags:
  - euterpe
  - sona
  - streaming
  - roadmap
---

## Overview

Designing an audio streaming system for Vesta: transcoding (Euterpe), delivery (Sona), and playback via **HLS** (MSE + HLS.js or native). Cast uses single-file Opus (full.mp4); we won't use AAC/MP3 for streaming. AirPlay uses output routing. Opus support may require a custom protocol extension (Safari doesn't support Opus fMP4 natively; AAC fallback or extension).

---

## Cast & AirPlay

### Why HLS

- **In-browser:** MSE + HLS.js (or native HLS). Single pipeline.
- **Cast** needs a playable URL — embedded receivers typically require single-file MP4, not HLS. Full-length Opus in MP4 works. **AirPlay** for audio uses output routing (device as speaker); for video, HLS URL works.

### Token TTL: Longer-Lived for Cast/AirPlay

- **In-browser:** 10 min TTL, proactive refresh. Ephemeral.
- **Cast/AirPlay:** Longer-lived tokens (content duration or ~2h cap). VOD HLS does not refetch the manifest — client gets it once, segment URLs must stay valid for the whole playback.
- **Rationale:** We explored refreshing via Chromecast `loadMedia` (new URL + `currentTime`) before token expiry. Latency between sender and Cast device varies; correcting for it would cause skips (rewind) or gaps. Simpler to use longer-lived tokens for Cast/AP.
- **Revoke on disconnect:** When user stops casting, Cast SDK fires a session-end event. We revoke the cast session immediately. Reduces exposure after they've stopped.
- **Tradeoff:** Same as other streaming services (SoundCloud, Spotify) — Cast/AirPlay require a URL that lasts. Accept the exposure, mitigate with rate limiting and revoke-on-disconnect.

### Cast Refresh Considered

- `session.loadMedia()` can load a new manifest URL with `currentTime` to resume. We could refresh before 10 min expiry.
- Rejected: Round-trip latency varies. Phone sends "start at 540s"; Cast receives 300ms later (now at 540.3s). Starting at 540 = 300ms rewind = audible skip. No built-in latency correction. Compensating is guesswork. Longer-lived tokens avoid the problem.

### Cast: Single-File Opus, No HLS

Compatibility testing (tools/test-pages) showed:

- **Embedded receivers** (Onkyo, many Chromecast Audio targets) often only support the Default Media Receiver. They typically cannot run custom Web Receiver apps.
- **HLS** is rarely supported by embedded receivers — metadata may load but playback fails. Use **single-file full.mp4** for Cast, not segmented HLS.
- **Streaming:** Opus only — we won't use AAC/MP3 for streaming. Cast gets full.mp4 (Opus); in-browser gets HLS.

### Cast UX: Quality Selection Disabled

When casting, grey out the quality button. Tooltip: "Quality selection is disabled when casting to Chromecast."

### AirPlay: Audio vs Video

- **Audio:** The receiver acts as an output device (like a wireless speaker). The sender decodes and streams audio to it — it's output routing, not URL-based casting. User selects the AirPlay device via `webkitShowPlaybackTargetPicker`; audio from that element routes to it. The sender's audio output is used for the stream.
- **Video:** The receiver fetches the media URL and plays it itself. The sender hands off playback — it does not stream decoded video. The sender's audio output stays free (e.g. for other apps or system sounds). MSE is not AirPlay-compatible (it requires a playable URL); provide HLS as fallback source for video. 

---

## Architecture

### Pipeline

1. **Euterpe** — ffmpeg HLS fMP4 → R2 at `candidates/{sourceId}/{name}_hls/` (init.mp4 + segments with opaque IDs, .m4s)
2. **Manifest** — m3u8 (and/or custom JSON from DB). Webhook provides `segmentDurations`.
3. **Stream API** — `GET /api/stream/{token}/manifest`, `GET /api/stream/{token}/init`, `GET /api/stream/{token}/seg/{id}`; Worker validates token, streams from R2
4. **Client** — MSE + HLS.js (or native HLS). Fetch manifest, init, segments; append to SourceBuffer; play via media element.
5. **Cast** — Single-file MP4 (Opus) URL; longer-lived token. **AirPlay** — Output routing for audio; HLS URL for video when applicable.
6. **Opus** — Safari doesn't support Opus fMP4 natively (documented). Use AAC fallback, or extend with a custom protocol for Opus where supported. Community reports suggest fMP4 Opus/FLAC may work on some players even though out of spec — **test before committing to AAC-only.**

### Compatibility Test: fMP4 Opus/FLAC on iOS (Planned)

Before committing to AAC fallback, run an empirical test on Apple devices:

**Setup:** Minimal HLS stream — fMP4 with Opus segments (and optionally FLAC), standard m3u8. Static test page (HLS.js or native `<audio src="...m3u8">`).

**Test matrix:**

| Scenario | What we're checking |
| -------- | ------------------- |
| iPhone Safari, in-browser | Does fMP4 Opus play at all? |
| iPhone Safari → AirPlay to Apple TV | Does AirPlay work with this stream? |
| Apple TV (receiver) | Does it play when receiving via AirPlay? |

**If it works:** Can use Opus with AAC fallback only for confirmed failures. **If it fails:** Stick with AAC for Safari; Opus for Chrome/Firefox only. Document results and update codec strategy.

- **TTL:** 10 min. **Refresh:** Proactive when `exp - now < 1 min`; on 401, immediately refresh and retry.
- **Refresh failures:** Keep using old token until refresh succeeds; 30 s grace period (5 segments) after expiry before pausing playback.
- **Cast/AP:** Separate token type, longer TTL, revoke on disconnect.

---

## Custom WAAPI Pipeline (Not Currently Planned)

A custom demux → decode (WASM) → Web Audio API pipeline would enable sample-accurate gapless crossfade, eager quality switching, and Opus on Safari via client-side decode. Deferred for now — HLS is simpler, works for Cast/AirPlay natively, and covers most use cases. Revisit if gapless/crossfade becomes a priority or if Safari Opus support is required without AAC fallback.

---

## Storage, Caching, Protection

See prior discussions for: Cache API (streaming cache), IndexedDB (offline downloads), storage persistence, clear-cache vs delete-downloads, FSA for disk storage option.

---

## Related

- [Metadata Providers](./metadata-providers.md)
- [MusicBrainz Integration](./musicbrainz-integration.md)
