/** @format */

import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
import {
	ENGAGEMENT_ACTIONS,
	ENGAGEMENT_OBJECT_TYPES,
	ENGAGEMENT_SUBJECT_TYPES,
	MENTION_TYPES,
	engagements,
} from "../db/schema";
import { z } from "../lib/validation";

const commentSchema = z.object({
	text: z.string().min(1),
});

const mentionSchema = z.object({
	mentionedType: z.enum(MENTION_TYPES),
	mentionedId: z.string().min(1),
});

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
	subjectType: z.enum(ENGAGEMENT_SUBJECT_TYPES),
	subjectId: z.string().min(1),
	action: z.enum(ENGAGEMENT_ACTIONS),
	objectType: z.enum(ENGAGEMENT_OBJECT_TYPES),
	objectId: z.string().min(1),
	comment: commentSchema.optional(),
	mention: mentionSchema.optional(),
});

export const updateEngagementSchema = z.object({
	comment: commentSchema.nullable().optional(),
	mention: mentionSchema.nullable().optional(),
});
