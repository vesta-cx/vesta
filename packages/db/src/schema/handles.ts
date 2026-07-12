/** @format */

import { relations, sql } from "drizzle-orm";
import {
	integer,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const HANDLE_SUBJECT_TYPES = ["user", "workspace"] as const;
export type HandleSubjectType = (typeof HANDLE_SUBJECT_TYPES)[number];

/**
 * Global public-handle registry for subjects that share the `/@<handle>`
 * namespace. The lowercased generated column owns case-insensitive lookup and
 * uniqueness while `handle` preserves user-facing capitalization.
 */
export const handles = sqliteTable(
	"handles",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		handle: text("handle").notNull(),
		handleLower: text("handle_lower")
			.generatedAlwaysAs(() => sql`lower(handle)`, {
				mode: "stored",
			})
			.notNull(),
		subjectType: text("subject_type", {
			enum: HANDLE_SUBJECT_TYPES,
		}).notNull(),
		subjectId: text("subject_id").notNull(),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		uniqueIndex("handles_handle_lower_unique").on(
			table.handleLower,
		),
		uniqueIndex("handles_subject_unique").on(
			table.subjectType,
			table.subjectId,
		),
	],
);

export const handlesRelations = relations(handles, () => ({}));
