ALTER TABLE `collections` ADD `status` text DEFAULT 'LISTED' NOT NULL;
UPDATE `collections`
SET `status` =
	CASE
		WHEN `visibility` = 'public' THEN 'LISTED'
		ELSE 'UNLISTED'
	END;
ALTER TABLE `collections` DROP COLUMN `visibility`;

DROP TABLE IF EXISTS `collection_visibility_settings`;

CREATE INDEX IF NOT EXISTS `permissions_subject_lookup_idx`
	ON `permissions` (
		`subject_type`,
		`subject_id`,
		`object_type`,
		`object_id`,
		`action`,
		`value`
	);
CREATE INDEX IF NOT EXISTS `permissions_object_lookup_idx`
	ON `permissions` (`object_type`, `object_id`, `action`, `value`);
CREATE INDEX IF NOT EXISTS `permissions_action_lookup_idx`
	ON `permissions` (`action`, `value`);
