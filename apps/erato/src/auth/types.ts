/** @format */

import type { AuthSession } from "@vesta-cx/auth";

export type GuestAuth = { type: "guest" };

export const SCOPES = [
	"users:read",
	"users:write",
	"workspaces:read",
	"workspaces:write",
	"resources:read",
	"resources:write",
	"collections:read",
	"collections:write",
	"teams:read",
	"teams:write",
	"engagements:read",
	"engagements:write",
	"permissions:read",
	"permissions:write",
	"features:read",
	"features:write",
	"organizations:read",
	"organizations:write",
	"subscriptions:read",
	"subscriptions:write",
	"admin",
] as const;

export type Scope = (typeof SCOPES)[number];
export const ADMIN_SCOPE = "admin" satisfies Scope;

export const API_KEY_SUBJECT_TYPES = [
	"user",
	"organization",
	"workspace",
] as const;

export type ApiKeySubjectType = (typeof API_KEY_SUBJECT_TYPES)[number];

export type ApiKeyAuth = {
	type: "apikey";
	subjectType: ApiKeySubjectType;
	subjectId: string;
	scopes: Scope[];
};

export type SessionAuth = {
	type: "session";
	subjectType: "user";
	subjectId: string;
	scopes: Scope[];
	session: AuthSession;
};

export type AuthContext = GuestAuth | ApiKeyAuth | SessionAuth;

export type ApiKeyMeta = {
	subjectType: ApiKeySubjectType;
	subjectId: string;
	scopes: Scope[];
	createdAt: string;
	expiresAt: string | null;
};

const isScopeArray = (value: unknown): value is Scope[] =>
	Array.isArray(value) &&
	value.every(
		(entry) =>
			typeof entry === "string" &&
			(SCOPES as readonly string[]).includes(entry),
	);

/** Type guard for parsed KV values. */
export const isApiKeyMeta = (value: unknown): value is ApiKeyMeta => {
	if (!value || typeof value !== "object") return false;
	const meta = value as Partial<ApiKeyMeta>;
	return (
		typeof meta.subjectId === "string" &&
		typeof meta.subjectType === "string" &&
		(API_KEY_SUBJECT_TYPES as readonly string[]).includes(
			meta.subjectType,
		) &&
		isScopeArray(meta.scopes) &&
		typeof meta.createdAt === "string" &&
		(typeof meta.expiresAt === "string" || meta.expiresAt === null)
	);
};

/** Parse a raw JSON string into ApiKeyMeta, returning null on invalid data. */
export const parseApiKeyMeta = (raw: string): ApiKeyMeta | null => {
	try {
		const parsed = JSON.parse(raw) as unknown;
		return isApiKeyMeta(parsed) ? parsed : null;
	} catch {
		return null;
	}
};
