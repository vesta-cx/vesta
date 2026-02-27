import { eq } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { resources } from "../db/schema";
import { z } from "../lib/validation";

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

export const createResourceSchema = z.object({
	ownerType: z.string().min(1),
	ownerId: z.string().min(1),
	type: z.string().min(1),
	title: z.string().nullable().optional(),
	excerpt: z.string().nullable().optional(),
	status: z.string().optional(),
});

export const updateResourceSchema = z.object({
	type: z.string().min(1).optional(),
	title: z.string().nullable().optional(),
	excerpt: z.string().nullable().optional(),
	status: z.string().optional(),
});

export const listedResourceWhere = () => eq(resources.status, "LISTED");
