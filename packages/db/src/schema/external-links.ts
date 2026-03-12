/** @format */

import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { EXTERNAL_LINK_SUBJECT_TYPES } from "./types";

export const externalLinks = sqliteTable(
	"external_links",
	{
		subjectType: text("subject_type", {
			enum: EXTERNAL_LINK_SUBJECT_TYPES,
		}).notNull(),
		subjectId: text("subject_id").notNull(),
		name: text("name").notNull(),
		url: text("url").notNull(),
		icon: text("icon"),
		position: integer("position").notNull().default(0),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		primaryKey({
			columns: [
				table.subjectType,
				table.subjectId,
				table.position,
			],
		}),
	],
);
