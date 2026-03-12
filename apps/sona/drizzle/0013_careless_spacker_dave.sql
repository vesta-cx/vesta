DROP TABLE IF EXISTS `pending_euterpe_jobs`;--> statement-breakpoint
-- D1: PRAGMA defer_foreign_keys must run in same batch as table ops (each stmt-breakpoint = separate tx)
PRAGMA defer_foreign_keys = on;
CREATE TABLE `__new_source_files` (
	`id` text PRIMARY KEY NOT NULL,
	`basename` text,
	`r2_key` text,
	`uploaded_at` integer NOT NULL,
	`license_url` text NOT NULL,
	`approved_at` integer,
	`approved_by` text,
	`title` text NOT NULL,
	`stream_url` text,
	`artist` text,
	`featured_artists` text,
	`remix_artists` text,
	`artist_url` text,
	`genre` text,
	`duration` integer
);
INSERT INTO `__new_source_files`("id", "basename", "r2_key", "uploaded_at", "license_url", "approved_at", "approved_by", "title", "stream_url", "artist", "featured_artists", "remix_artists", "artist_url", "genre", "duration") SELECT "id", "basename", "r2_key", "uploaded_at", "license_url", "approved_at", "approved_by", "title", "stream_url", "artist", "featured_artists", "remix_artists", "artist_url", "genre", "duration" FROM `source_files`;
DROP TABLE `source_files`;
ALTER TABLE `__new_source_files` RENAME TO `source_files`;
PRAGMA defer_foreign_keys = off;
