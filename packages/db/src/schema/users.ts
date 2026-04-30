/** @format */

import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { workspaces } from "./workspaces";

// Users are managed by WorkOS. This table stores vesta-specific extensions
// (theme, preferences, bio) that don't belong in WorkOS custom attributes.

export const users = sqliteTable("users", {
	workosUserId: text("workos_user_id").primaryKey(),
	email: text("email").notNull(),
	/**
	 * Vesta-owned public handle. Nullable so WorkOS-provisioned users can be
	 * created before they pick one. Unique within users; cross-table
	 * uniqueness with `workspaces.slug` is enforced at the application layer
	 * (the public `/@<handle>` namespace is shared).
	 */
	handle: text("handle").unique(),
	displayName: text("display_name"),
	avatarUrl: text("avatar_url"),
	bio: text("bio"),
	themeConfig: text("theme_config", { mode: "json" }).$type<{
		colors?: Record<string, string>;
		fonts?: Record<string, string>;
		layout?: string;
	}>(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
	ownedWorkspaces: many(workspaces),
}));
