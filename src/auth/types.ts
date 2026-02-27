/** @format */

export type GuestAuth = { type: "guest" };

export type ApiKeyAuth = { type: "apikey"; userId: string; scopes: string[] };

export type AuthContext = GuestAuth | ApiKeyAuth;

export type ApiKeyMeta = {
	userId: string;
	scopes: string[];
	createdAt: string;
	expiresAt: string | null;
};

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
	"subscriptions:read",
	"subscriptions:write",
	"admin",
] as const;

export type Scope = (typeof SCOPES)[number];

const isStringArray = (value: unknown): value is string[] =>
	Array.isArray(value) &&
	value.every((entry) => typeof entry === "string");

/** Type guard for parsed KV values. */
export const isApiKeyMeta = (value: unknown): value is ApiKeyMeta => {
	if (!value || typeof value !== "object") return false;
	const meta = value as Partial<ApiKeyMeta>;
	return (
		typeof meta.userId === "string" &&
		isStringArray(meta.scopes) &&
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
