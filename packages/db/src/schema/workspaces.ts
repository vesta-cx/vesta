/** @format */

import { relations } from "drizzle-orm";
import {
	index,
	integer,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { resources } from "./resources";
import { OWNER_TYPES, WORKSPACE_STATUSES } from "./types";

export const workspaces = sqliteTable(
	"workspaces",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		name: text("name").notNull(),
		slug: text("slug").notNull().unique(),
		description: text("description"),
		ownerType: text("owner_type", { enum: OWNER_TYPES }).notNull(),
		ownerId: text("owner_id").notNull(),
		avatarUrl: text("avatar_url"),
		bannerUrl: text("banner_url"),
		status: text("status", { enum: WORKSPACE_STATUSES })
			.notNull()
			.default("LISTED"),
		createdAt: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer("updated_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [
		index("workspaces_owner_idx").on(
			table.ownerType,
			table.ownerId,
		),
		index("workspaces_status_idx").on(table.status),
	],
);

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	owner: one(users, {
		fields: [workspaces.ownerId],
		references: [users.workosUserId],
	}),
	ownedResources: many(resources),
}));
