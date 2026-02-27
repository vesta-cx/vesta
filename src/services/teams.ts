import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { teams } from "../db/schema";
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

export const createTeamSchema = z.object({
	name: z.string().min(1),
	ownerId: z.string().min(1),
	organizationId: z.string().min(1),
});

export const updateTeamSchema = z.object({
	name: z.string().min(1).optional(),
});
