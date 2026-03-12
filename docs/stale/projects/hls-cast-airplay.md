# HLS, Cast, and AirPlay Compatibility Notes

## Cast (Chromecast)

- **Cast SDK** requires HTTPS in production, but works on localhost for local development.
- **Self-signed certs:** The Chromecast may reject self-signed HTTPS certificates. Deployed Pages (.pages.dev) uses valid certs.
- **Default Media Receiver** has limited HLS support; audio-only streams are especially flaky. AV receivers (Onkyo, etc.) often don't support HLS at all.

## AirPlay

- **Audio:** AirPlay treats the device as an output (like a wireless speaker) — the playing device decodes and streams audio to it. It's output routing, not URL-based casting.
- **Video:** AirPlay can be media-specific — send a URL to Apple TV, which fetches and plays it. MSE is not AirPlay-compatible; provide HLS as fallback source for video.

## HLS Playback Browser Support

- **Native HLS:** Safari, Chrome 142+, Edge 142+
- **HLS.js (MSE):** Firefox, older Chromium
