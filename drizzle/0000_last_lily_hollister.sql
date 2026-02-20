CREATE TABLE `transcode_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`source_file_id` text,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
