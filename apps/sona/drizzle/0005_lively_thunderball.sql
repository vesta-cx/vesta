CREATE TABLE `easter_egg_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);

-- Seed messages. Add more via admin or direct DB. Messages in DB keep them out of app source.
INSERT INTO `easter_egg_messages` (`id`, `message`, `created_at`) VALUES
	(lower(hex(randomblob(8))), 'good data... yum', unixepoch() * 1000),
	(lower(hex(randomblob(8))), 'your ears are doing great today', unixepoch() * 1000),
	(lower(hex(randomblob(8))), 'we appreciate you', unixepoch() * 1000),
	(lower(hex(randomblob(8))), 'this data is *chef''s kiss*', unixepoch() * 1000),
	(lower(hex(randomblob(8))), 'quality input from a quality human', unixepoch() * 1000);
