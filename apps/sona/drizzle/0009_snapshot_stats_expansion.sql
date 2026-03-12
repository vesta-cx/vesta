ALTER TABLE `result_snapshots` ADD `sourceset_song_count` integer;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `sourceset_artist_count` integer;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `source_coverage` real;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `unique_pairing_count` integer;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `rounds_per_mode` text;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `win_rate_by_mode` text;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `neither_rate_by_mode` text;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `avg_response_time_by_mode` text;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `top_genres` text;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `top_artists` text;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `top_songs` text;--> statement-breakpoint
ALTER TABLE `result_snapshots` ADD `top_codecs` text;
