CREATE TABLE `pending_euterpe_jobs` (
	`job_id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL DEFAULT '',
	`license_url` text NOT NULL,
	`genre` text,
	`stream_url` text,
	`created_at` integer NOT NULL
);
