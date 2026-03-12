/** @format */

import { eq } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import {
	resourceCreateSchema,
	resourceUpdateSchema,
} from "@vesta-cx/db/entity-schemas";
import { resources } from "../db/schema";

export const resourceListConfig: ListQueryConfig = {
	filters: {
		status: { column: resources.status },
		type: { column: resources.type },
		owner_id: { column: resources.ownerId },
		owner_type: { column: resources.ownerType },
		title: { column: resources.title, op: "like" },
	},
	sortable: {
		created_at: resources.createdAt,
		updated_at: resources.updatedAt,
		title: resources.title,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createResourceSchema = resourceCreateSchema;

export const updateResourceSchema = resourceUpdateSchema;

export const listedResourceWhere = () => eq(resources.status, "LISTED");
