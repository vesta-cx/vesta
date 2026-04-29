/** @format */

import { HTTPException } from "hono/http-exception";
import type { ApiKeyAuth, AuthContext, Scope, SessionAuth } from "./types";
import { ADMIN_SCOPE } from "./types";

export const hashApiKey = async (raw: string): Promise<string> => {
	const encoded = new TextEncoder().encode(raw);
	const buffer = await crypto.subtle.digest("SHA-256", encoded);
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
};

export const isAuthenticated = (
	auth: AuthContext,
): auth is ApiKeyAuth | SessionAuth =>
	auth.type === "apikey" || auth.type === "session";

export const requireAuth = (auth: AuthContext): ApiKeyAuth | SessionAuth => {
	if (!isAuthenticated(auth)) {
		throw new HTTPException(401, {
			message: "Authentication required",
		});
	}
	return auth;
};

/** True if authenticated with matching scope or admin. Returns false for guests. */
export const hasScope = (auth: AuthContext, scope: Scope): boolean => {
	if (!isAuthenticated(auth)) return false;
	return auth.scopes.includes(ADMIN_SCOPE) || auth.scopes.includes(scope);
};

/**
 * Throws 403 if scope not present. For public-read endpoints that allow
 * guests, branch on isAuthenticated() first rather than calling this.
 */
export const requireScope = (auth: AuthContext, scope: Scope): void => {
	if (!hasScope(auth, scope)) {
		throw new HTTPException(403, {
			message: "Forbidden: insufficient scope",
		});
	}
};

/** Maps HTTP method to scope suffix: GET/HEAD -> "read", everything else -> "write". */
export const scopeForMethod = (method: string): "read" | "write" =>
	method.toUpperCase() === "GET" || method.toUpperCase() === "HEAD" ?
		"read"
	:	"write";
