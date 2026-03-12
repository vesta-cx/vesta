# Multi-track Directory Upload

The directory upload expects files in the structure produced by `generate-permutations.sh`:
`{codec}/{basename}_{codec}_{bitrate}.{ext}`.

## Grouping

Files are grouped by basename (regex: `^(.+)_(flac|opus|mp3|aac)_(\d+)\.[a-z0-9]+$`). One `TrackEntry` per unique basename.

## Metadata

Prefer MP3 for `parseBlob()` (most reliable ID3 tags), fall back to FLAC. Auto-fill title, artist, genre, duration. Title and license URL are required.

## Upload

Client uploads each file **sequentially** via `uploadSingleFile` (one XHR per file), avoiding large single-request body limits. Order: FLAC first per track, then candidates. Shared `license_url`/`stream_url` + per-track metadata sent with each request.

## Validation

Incomplete tracks (missing title or license) use `border-destructive` and red indicator. Submit disabled until all complete and shared license filled.

## License

Shared default at top; per-track override optional. Effective license = `track.licenseUrl || sharedLicenseUrl`.

## Merge on upload

If a source with the same basename (or matching title for legacy rows) exists, new candidates are added instead of creating a duplicate. Enables adding mp3/flac to existing opus/aac sources. Duplicate codec+bitrate candidates are skipped.
