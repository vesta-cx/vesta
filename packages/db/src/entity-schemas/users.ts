/** @format */

import { z } from "zod";

/**
 * Reserved top-level paths that cannot be claimed as user handles or
 * workspace slugs. Mirrors docs/.../url-structure.md.
 */
export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
	"about",
	"admin",
	"api",
	"auth",
	"c",
	"collections",
	"dashboard",
	"discover",
	"explore",
	"feed",
	"help",
	"legal",
	"me",
	"notifications",
	"search",
	"settings",
	"user",
]);

/**
 * Public handle: lowercase alphanumeric, hyphens, underscores. 3–32 chars.
 * Shared namespace with workspace slugs (see schema/users.ts).
 */
export const userHandleSchema = z
	.string()
	.min(3)
	.max(32)
	.regex(
		/^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/,
		"Use lowercase letters, numbers, hyphens, or underscores.",
	)
	.refine((value) => !RESERVED_HANDLES.has(value), {
		message: "That handle is reserved.",
	});

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
	handle: userHandleSchema.nullable().optional(),
	displayName: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bio: z.string().nullable().optional(),
	organizationId: z.string().min(1),
});

export const userUpdateSchema = z.object({
	email: z.string().email().optional(),
	handle: userHandleSchema.nullable().optional(),
	displayName: z.string().nullable().optional(),
	avatarUrl: z.string().url().nullable().optional(),
	bio: z.string().nullable().optional(),
	themeConfig: userThemeConfigSchema.optional(),
});
