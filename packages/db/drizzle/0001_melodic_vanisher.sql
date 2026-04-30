ALTER TABLE `users` ADD `handle` text;--> statement-breakpoint
CREATE UNIQUE INDEX `users_handle_unique` ON `users` (`handle`);