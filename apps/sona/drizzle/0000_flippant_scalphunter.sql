CREATE TABLE `answers` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`device_id` text NOT NULL,
	`candidate_a_id` text NOT NULL,
	`candidate_b_id` text NOT NULL,
	`selected` text NOT NULL,
	`pairing_type` text NOT NULL,
	`transition_mode` text NOT NULL,
	`start_time` integer NOT NULL,
	`segment_duration` integer NOT NULL,
	`response_time` integer,
	FOREIGN KEY (`device_id`) REFERENCES `listening_devices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_a_id`) REFERENCES `candidate_files`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_b_id`) REFERENCES `candidate_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `candidate_files` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`codec` text NOT NULL,
	`bitrate` integer NOT NULL,
	`source_file_id` text NOT NULL,
	FOREIGN KEY (`source_file_id`) REFERENCES `source_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ephemeral_stream_urls` (
	`token` text PRIMARY KEY NOT NULL,
	`candidate_file_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`candidate_file_id`) REFERENCES `candidate_files`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `listening_devices` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`modified_at` integer NOT NULL,
	`approved_at` integer,
	`approved_by` text,
	`device_type` text NOT NULL,
	`connection_type` text NOT NULL,
	`brand` text NOT NULL,
	`model` text NOT NULL,
	`price_tier` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `quality_options` (
	`codec` text NOT NULL,
	`bitrate` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	PRIMARY KEY(`codec`, `bitrate`)
);
--> statement-breakpoint
CREATE TABLE `result_snapshots` (
	`created_at` integer PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`total_responses` integer NOT NULL,
	`insights` text
);
--> statement-breakpoint
CREATE TABLE `source_files` (
	`id` text PRIMARY KEY NOT NULL,
	`r2_key` text NOT NULL,
	`uploaded_at` integer NOT NULL,
	`license_url` text NOT NULL,
	`approved_at` integer,
	`approved_by` text,
	`title` text NOT NULL,
	`stream_url` text,
	`artist` text,
	`artist_url` text,
	`genre` text,
	`duration` integer NOT NULL
);
