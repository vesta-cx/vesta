ALTER TABLE `users` ADD `handle_normalized` text;--> statement-breakpoint
UPDATE `users` SET `handle_normalized` = lower(`handle`) WHERE `handle` IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_normalized_unique` ON `users` (`handle_normalized`);
