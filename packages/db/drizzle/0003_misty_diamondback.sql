CREATE TABLE `handles` (
	`id` text PRIMARY KEY NOT NULL,
	`handle` text NOT NULL,
	`handle_lower` text GENERATED ALWAYS AS (lower(handle)) STORED NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `handles_handle_lower_unique` ON `handles` (`handle_lower`);--> statement-breakpoint
CREATE UNIQUE INDEX `handles_subject_unique` ON `handles` (`subject_type`,`subject_id`);--> statement-breakpoint
INSERT INTO `handles` (`id`, `handle`, `subject_type`, `subject_id`, `created_at`, `updated_at`)
SELECT 'user:' || `workos_user_id`, `handle`, 'user', `workos_user_id`, `created_at`, `updated_at`
FROM `users`
WHERE `handle` IS NOT NULL;--> statement-breakpoint
INSERT INTO `handles` (`id`, `handle`, `subject_type`, `subject_id`, `created_at`, `updated_at`)
SELECT 'workspace:' || `id`, `slug`, 'workspace', `id`, `created_at`, `updated_at`
FROM `workspaces`;