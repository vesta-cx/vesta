/** @format */

import { relations } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { posts } from "./posts";
import { resourceUrls } from "./resource-urls";
import {
	OWNER_TYPES,
	RESOURCE_TYPES,
	RESOURCE_STATUSES,
	AUTHOR_TYPES,
} from "./types";

export const resources = sqliteTable("resources", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	ownerType: text("owner_type", { enum: OWNER_TYPES }).notNull(),
	ownerId: text("owner_id").notNull(),
	type: text("type", { enum: RESOURCE_TYPES }).notNull(),
	title: text("title"),
	excerpt: text("excerpt"),
	status: text("status", { enum: RESOURCE_STATUSES })
		.notNull()
		.default("UNLISTED"),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const resourceAuthors = sqliteTable(
	"resource_authors",
	{
		resourceId: text("resource_id")
			.notNull()
			.references(() => resources.id),
		authorType: text("author_type", {
			enum: AUTHOR_TYPES,
		}).notNull(),
		authorId: text("author_id").notNull(),
		role: text("role"),
		addedAt: integer("added_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		primaryKey({
			columns: [
				table.resourceId,
				table.authorType,
				table.authorId,
			],
		}),
	],
);

export const resourcesRelations = relations(resources, ({ one, many }) => ({
	post: one(posts, {
		fields: [resources.id],
		references: [posts.resourceId],
	}),
	authors: many(resourceAuthors),
	urls: many(resourceUrls),
}));

export const resourceAuthorsRelations = relations(
	resourceAuthors,
	({ one }) => ({
		resource: one(resources, {
			fields: [resourceAuthors.resourceId],
			references: [resources.id],
		}),
	}),
);
