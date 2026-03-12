/** @format */

import { relations } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { resources } from "./resources";

export const resourceUrls = sqliteTable(
	"resource_urls",
	{
		resourceId: text("resource_id")
			.notNull()
			.references(() => resources.id),
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
		primaryKey({ columns: [table.resourceId, table.position] }),
	],
);

export const resourceUrlsRelations = relations(resourceUrls, ({ one }) => ({
	resource: one(resources, {
		fields: [resourceUrls.resourceId],
		references: [resources.id],
	}),
}));
