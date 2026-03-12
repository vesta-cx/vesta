/** @format */

import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ENGAGEMENT_SUBJECT_TYPES = ["user", "workspace"] as const;
export type EngagementSubjectType = (typeof ENGAGEMENT_SUBJECT_TYPES)[number];

export const ENGAGEMENT_ACTIONS = [
	"like",
	"comment",
	"repost",
	"follow",
	"subscribe",
	"mention",
	"bookmark",
] as const;
export type EngagementAction = (typeof ENGAGEMENT_ACTIONS)[number];

export const ENGAGEMENT_OBJECT_TYPES = [
	"resource",
	"workspace",
	"collection",
	"user",
] as const;
export type EngagementObjectType = (typeof ENGAGEMENT_OBJECT_TYPES)[number];

export const MENTION_TYPES = ["user", "workspace", "resource"] as const;
export type MentionType = (typeof MENTION_TYPES)[number];

export const engagements = sqliteTable("engagements", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	subjectType: text("subject_type", {
		enum: ENGAGEMENT_SUBJECT_TYPES,
	}).notNull(),
	subjectId: text("subject_id").notNull(),
	action: text("action", { enum: ENGAGEMENT_ACTIONS }).notNull(),
	objectType: text("object_type", {
		enum: ENGAGEMENT_OBJECT_TYPES,
	}).notNull(),
	objectId: text("object_id").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const engagementComments = sqliteTable("engagement_comments", {
	engagementId: text("engagement_id")
		.primaryKey()
		.references(() => engagements.id),
	text: text("text").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const engagementMentions = sqliteTable("engagement_mentions", {
	engagementId: text("engagement_id")
		.primaryKey()
		.references(() => engagements.id),
	mentionedType: text("mentioned_type", {
		enum: MENTION_TYPES,
	}).notNull(),
	mentionedId: text("mentioned_id").notNull(),
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.$defaultFn(() => new Date()),
});

export const engagementsRelations = relations(engagements, ({ one }) => ({
	comment: one(engagementComments, {
		fields: [engagements.id],
		references: [engagementComments.engagementId],
	}),
	mention: one(engagementMentions, {
		fields: [engagements.id],
		references: [engagementMentions.engagementId],
	}),
}));

export const engagementCommentsRelations = relations(
	engagementComments,
	({ one }) => ({
		engagement: one(engagements, {
			fields: [engagementComments.engagementId],
			references: [engagements.id],
		}),
	}),
);

export const engagementMentionsRelations = relations(
	engagementMentions,
	({ one }) => ({
		engagement: one(engagements, {
			fields: [engagementMentions.engagementId],
			references: [engagements.id],
		}),
	}),
);
