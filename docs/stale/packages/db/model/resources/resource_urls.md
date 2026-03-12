---
title: Resource URLs (Smart Links)
description: External URLs linked to resources (DSP links, pre-orders, etc.) with security considerations
---

# Resource URLs (Smart Links)

Resource URLs are external links attached to resources, typically pointing to DSPs (Spotify, Apple Music, YouTube) or pre-order pages. Each resource can have multiple URLs with custom display names and icons.

## Schema

```
resource_urls:
resource_id          UUID (FK → resources.id)
name                 string ("Spotify", "Pre-order", "Listen on SoundCloud", etc.)
url                  string (https://open.spotify.com/track/...)
icon                 string (Iconify slug: "mdi:spotify", "fa:apple", etc.)
position             integer (display order, 1-indexed)
created_at           timestamp
updated_at           timestamp
```

## Icon Handling

**Phase 1: Iconify Only**

- Users select from Iconify icon library (`mdi:spotify`, `fa:apple`, etc.)
- Iconify is a reputable third-party CDN; trust their icons
- No user-uploaded or URL-based icons in Phase 1

**Phase 2+: Custom Icons (with sanitization)**

- Support URL-based icons (PNG, JPG, WEBP only; no SVG initially)
- Support inline SVG (sanitized with DOMPurify)
- Validate with magic byte checking, not just MIME type headers

## Security Considerations

### Icon Security

**Threat:** Malicious SVG/image URLs could contain XSS payloads or polyglot files.

**Phase 1 mitigation:** Only allow Iconify slugs (trusted CDN). Defer URL/SVG icons.

**Phase 2+ implementation:**

1. **For URL-based icons:** Magic byte validation (check file signatures, not just MIME headers)
2. **For inline SVG:** Sanitize with DOMPurify before storing
3. **Never trust Content-Type headers** — they can be spoofed

### Tracking Pixels (Future)

**Threat:** Arbitrary tracking pixel URLs could contain XSS or log user data insecurely.

**Phase 2+ approach:**

- Whitelist trusted tracking providers (Meta Pixel, Google Analytics, TikTok Pixel, Mixpanel)
- Server-side validation: Parse pixel code, extract provider + ID
- Generate pixel code at render-time, don't store raw code
- Never allow arbitrary JavaScript in tracking pixels

## Query Examples

```sql
-- Get all URLs for a resource, ordered
SELECT * FROM resource_urls
WHERE resource_id = {resource_id}
ORDER BY position ASC;

-- Add a resource URL
INSERT INTO resource_urls (resource_id, name, url, icon, position)
VALUES (?, ?, ?, ?, ?);
```

## See Also

- [Resource](./resource.md) — Resources can have multiple URLs
- [Post Resource Type](./types/posts.md) — Posts with external links
