/** @format */

import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { resources } from "./resources";

export const posts = sqliteTable("posts", {
	resourceId: text("resource_id")
		.primaryKey()
		.references(() => resources.id),
	body: text("body").notNull(),
	bodyHtml: text("body_html"),
	featuredImage: text("featured_image"),
});

export const postsRelations = relations(posts, ({ one }) => ({
	resource: one(resources, {
		fields: [posts.resourceId],
		references: [resources.id],
	}),
}));
