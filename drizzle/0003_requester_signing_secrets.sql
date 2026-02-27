CREATE TABLE `requester_signing_secrets` (
  `id` text PRIMARY KEY NOT NULL,
  `requester_id` text NOT NULL,
  `secret` text NOT NULL,
  `is_active` integer NOT NULL DEFAULT 1,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX `idx_requester_signing_active` ON `requester_signing_secrets` (`requester_id`, `is_active`, `updated_at`);
