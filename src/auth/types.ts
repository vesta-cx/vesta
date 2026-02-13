/** Encrypted session payload stored in the cookie. */
export interface AuthSession {
	userId: string;
	email: string;
	organizationId: string;
	firstName?: string;
	lastName?: string;
	profilePictureUrl?: string;
	accessToken: string;
	refreshToken: string;
}

/** Parsed response from WorkOS User Management authenticate endpoint. */
export interface AuthResult {
	user: WorkOSUser;
	organizationId: string | undefined;
	accessToken: string;
	refreshToken: string;
}

/** User object shape returned by WorkOS. */
export interface WorkOSUser {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	email_verified: boolean;
	profile_picture_url?: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Configuration for `createAuthHandle`.
 * All paths default to `/auth/*`; override per-app as needed.
 */
export interface AuthHandleConfig {
	/** Path prefixes that require authentication (e.g. `['/admin']`). */
	protectedPaths: string[];
	/** Redirect target for unauthenticated users. Default: `'/auth/login'` */
	loginPath?: string;
	/** Where to send users after successful login. Default: `'/'` */
	postLoginRedirect?: string;
	/** Cookie name for the sealed session. Default: `'session'` */
	cookieName?: string;
	/** Session lifetime in seconds. Default: `86400` (24 h) */
	sessionMaxAge?: number;
}

/**
 * Expected WorkOS-related env vars on the Cloudflare platform object.
 * All apps in the monorepo use the same `PRIVATE_WORKOS_*` names by convention.
 */
export interface AuthEnv {
	PRIVATE_WORKOS_CLIENT_ID: string;
	PRIVATE_WORKOS_API_KEY: string;
	PRIVATE_WORKOS_ORG_ID: string;
	PRIVATE_WORKOS_COOKIE_PASSWORD: string;
}
