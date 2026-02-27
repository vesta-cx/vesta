/** @format */

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const transcodeJobs = sqliteTable("transcode_jobs", {
	id: text("id").primaryKey(),
	status: text("status", {
		enum: ["pending", "processing", "complete", "failed"],
	}).notNull(),
	sourceFileId: text("source_file_id"),
	error: text("error"),
	createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
