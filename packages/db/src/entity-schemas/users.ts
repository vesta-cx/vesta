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
 * Pattern for a public handle: lowercase letters, digits, hyphens, and
 * underscores; must start and end with an alphanumeric. Shared between the
 * Zod entity schemas and any Effect schemas that re-validate at the edge.
 */
export const USER_HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/;

export const USER_HANDLE_MIN_LENGTH = 3;
export const USER_HANDLE_MAX_LENGTH = 32;

/** Strip every character that isn't part of the handle charset. */
export const sanitizeUserHandle = (input: string): string =>
	input.toLowerCase().replace(/[^a-z0-9_-]/g, "");

/**
 * Charset rules for free-form profile fields. Single-line fields strip ASCII
 * + C1 control characters — including newlines. Multi-line fields preserve
 * tab, line feed, and carriage return so users can format paragraphs;
 * everything else in the control range is stripped.
 *
 * Each rule is exported as both a sanitizer (idempotent transform, used by
 * inputs to reject disallowed characters as the user types) and a validator
 * (predicate, used by the server to reject inputs that bypassed the UI).
 */
const SINGLE_LINE_DISALLOWED = /[\u0000-\u001F\u007F-\u009F]/u;
const MULTI_LINE_DISALLOWED =
	/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u;

export const isSingleLineSafe = (input: string): boolean =>
	!SINGLE_LINE_DISALLOWED.test(input);
export const isMultiLineSafe = (input: string): boolean =>
	!MULTI_LINE_DISALLOWED.test(input);

export const sanitizeSingleLine = (input: string): string =>
	input.replace(/[\u0000-\u001F\u007F-\u009F]/gu, "");
export const sanitizeMultiLine = (input: string): string =>
	input.replace(
		/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu,
		"",
	);

/**
 * Public handle. Shared namespace with workspace slugs (see schema/users.ts).
 */
export const userHandleSchema = z
	.string()
	.min(USER_HANDLE_MIN_LENGTH)
	.max(USER_HANDLE_MAX_LENGTH)
	.regex(
		USER_HANDLE_PATTERN,
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
