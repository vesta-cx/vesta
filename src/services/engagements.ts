import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import { engagements } from "../db/schema";
import { z } from "../lib/validation";

export const engagementListConfig: ListQueryConfig = {
	filters: {
		subject_type: { column: engagements.subjectType },
		subject_id: { column: engagements.subjectId },
		action: { column: engagements.action },
		object_type: { column: engagements.objectType },
		object_id: { column: engagements.objectId },
	},
	sortable: {
		created_at: engagements.createdAt,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const createEngagementSchema = z.object({
	subjectType: z.string().min(1),
	subjectId: z.string().min(1),
	action: z.string().min(1),
	objectType: z.string().min(1),
	objectId: z.string().min(1),
	comment: z
		.object({
			text: z.string().min(1),
		})
		.optional(),
	mention: z
		.object({
			mentionedType: z.string().min(1),
			mentionedId: z.string().min(1),
		})
		.optional(),
});
