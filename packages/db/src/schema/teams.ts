/** @format */

import { relations } from "drizzle-orm";
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name").notNull(),
	ownerId: text("owner_id").notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const teamUsers = sqliteTable(
	"team_users",
	{
		teamId: text("team_id")
			.notNull()
			.references(() => teams.id),
		userId: text("user_id").notNull(),
		addedAt: integer("added_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(table) => [primaryKey({ columns: [table.teamId, table.userId] })],
);

export const teamsRelations = relations(teams, ({ many }) => ({
	members: many(teamUsers),
}));

export const teamUsersRelations = relations(teamUsers, ({ one }) => ({
	team: one(teams, {
		fields: [teamUsers.teamId],
		references: [teams.id],
	}),
}));
