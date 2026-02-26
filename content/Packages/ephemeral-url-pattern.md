# Ephemeral URL Pattern

For time-limited access to resources without revealing internal IDs or metadata:

1. **Generate**: Insert a UUID token + resource FK + `expires_at` into a lookup table
2. **Serve**: On GET, lookup by token. If expired, delete row and return 410 Gone. Otherwise, fetch the resource and stream it.
3. **Consume**: After the answer is submitted, delete the tokens to prevent re-use.

This avoids signed URLs (which R2 Workers don't support) while keeping resource IDs hidden from the client. The client only sees opaque tokens in `/api/stream/[token]`.

Key: **never reveal codec, bitrate, or file identity** in response headers or URLs.
