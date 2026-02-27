ALTER TABLE `inbox` ADD `workload_type` text NOT NULL DEFAULT 'audio:transcode';
CREATE INDEX `idx_inbox_workload` ON `inbox` (`workload_type`, `status`, `scheduled_at`);
