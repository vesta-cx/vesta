/** @format */

import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { teamUsers, teams } from "../db/schema";
import { z } from "../lib/validation";

export const teamListConfig: ListQueryConfig = {
	filters: {
		owner_id: { column: teams.ownerId },
		organization_id: { column: teams.organizationId },
		name: { column: teams.name, op: "like" },
	},
	sortable: {
		created_at: teams.createdAt,
		updated_at: teams.updatedAt,
		name: teams.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const teamMemberListConfig: ListQueryConfig = {
	filters: {
		user_id: { column: teamUsers.userId },
	},
	sortable: {
		user_id: teamUsers.userId,
	},
	defaultSort: { key: "user_id", dir: "asc" },
};

export const createTeamSchema = z.object({
	name: z.string().min(1).max(255),
	ownerId: z.string().min(1),
	organizationId: z.string().min(1),
});

// ownerId and organizationId are immutable after creation.
export const updateTeamSchema = z.object({
	name: z.string().min(1).max(255).optional(),
});

export const addMemberSchema = z.object({
	userId: z.string().min(1),
});
