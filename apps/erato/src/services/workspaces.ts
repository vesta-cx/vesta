/** @format */

import { eq } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import {
	workspaceCreateSchema,
	workspaceUpdateSchema,
} from "@vesta-cx/db/entity-schemas";
import { workspaces } from "../db/schema";

export const workspaceListConfig: ListQueryConfig = {
	filters: {
		owner_id: { column: workspaces.ownerId },
		owner_type: { column: workspaces.ownerType },
		status: { column: workspaces.status },
		slug: { column: workspaces.slug },
	},
	sortable: {
		created_at: workspaces.createdAt,
		updated_at: workspaces.updatedAt,
		name: workspaces.name,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createWorkspaceSchema = workspaceCreateSchema;

export const updateWorkspaceSchema = workspaceUpdateSchema;

export const listedWorkspaceWhere = () => eq(workspaces.status, "LISTED");
