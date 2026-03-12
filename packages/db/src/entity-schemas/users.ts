/** @format */

import { z } from "zod";

export const userThemeConfigSchema = z
	.object({
		colors: z.record(z.string(), z.string()).optional(),
		fonts: z.record(z.string(), z.string()).optional(),
		layout: z.string().optional(),
	})
	.nullable();

export const userCreateSchema = z.object({
	workosUserId: z.string().min(1),
	email: z.string().email(),
	displayName: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bio: z.string().nullable().optional(),
	organizationId: z.string().min(1),
});

export const userUpdateSchema = z.object({
	email: z.string().email().optional(),
	displayName: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bio: z.string().nullable().optional(),
	themeConfig: userThemeConfigSchema.optional(),
});
