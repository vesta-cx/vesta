CREATE TABLE `external_links` (
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`icon` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	PRIMARY KEY(`subject_type`, `subject_id`, `position`)
);
--> statement-breakpoint
CREATE INDEX `external_links_subject_idx` ON `external_links` (`subject_type`,`subject_id`);
--> statement-breakpoint
INSERT INTO `external_links` (
	`subject_type`,
	`subject_id`,
	`name`,
	`url`,
	`icon`,
	`position`,
	`created_at`,
	`updated_at`
)
SELECT
	'resource',
	`resource_id`,
	`name`,
	`url`,
	`icon`,
	`position`,
	`created_at`,
	`updated_at`
FROM `resource_urls`;
