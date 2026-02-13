import type { AuthResult } from "./types.js";

/** Raw shape returned by WorkOS User Management authenticate endpoint. */
interface WorkOSAuthResponse {
	user: {
		id: string;
		email: string;
		first_name: string | null;
		last_name: string | null;
		email_verified: boolean;
		profile_picture_url?: string | null;
		created_at: string;
		updated_at: string;
	};
	organization_id?: string;
	access_token: string;
	refresh_token: string;
}

/**
 * Build the WorkOS AuthKit authorization URL scoped to an organization.
 * Uses the User Management API, not SSO.
 */
export const getAuthorizationUrl = (opts: {
	clientId: string;
	redirectUri: string;
	organizationId: string;
	state?: string;
}): string => {
	const params = new URLSearchParams({
		client_id: opts.clientId,
		redirect_uri: opts.redirectUri,
		response_type: "code",
		provider: "authkit",
		organization_id: opts.organizationId,
	});
	if (opts.state) params.set("state", opts.state);
	return `https://api.workos.com/user_management/authorize?${params.toString()}`;
};

/**
 * Exchange an authorization code for a user profile + tokens via
 * the WorkOS User Management authenticate endpoint.
 */
export const authenticateWithCode = async (opts: {
	code: string;
	clientId: string;
	apiKey: string;
}): Promise<AuthResult | null> => {
	const response = await fetch(
		"https://api.workos.com/user_management/authenticate",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				client_id: opts.clientId,
				client_secret: opts.apiKey,
				grant_type: "authorization_code",
				code: opts.code,
			}),
		},
	);

	if (!response.ok) return null;

	const data = (await response.json()) as WorkOSAuthResponse;
	if (!data.user?.id || !data.user?.email) return null;

	return {
		user: data.user,
		organizationId: data.organization_id,
		accessToken: data.access_token,
		refreshToken: data.refresh_token,
	};
};

/**
 * Build the WorkOS logout URL that ends the user's WorkOS session.
 * After logout, WorkOS redirects to the configured "App homepage URL"
 * or to `returnTo` if it matches a configured Sign-out redirect URI.
 *
 * The `sid` (session ID) is extracted from the access token JWT claims.
 */
export const getLogoutUrl = (opts: {
	accessToken: string;
	returnTo?: string;
}): string | null => {
	try {
		const [, payload] = opts.accessToken.split(".");
		if (!payload) return null;

		const decoded = JSON.parse(atob(payload)) as { sid?: string };
		if (!decoded.sid) return null;

		const params = new URLSearchParams({ session_id: decoded.sid });
		if (opts.returnTo) params.set("return_to", opts.returnTo);

		return `https://api.workos.com/user_management/sessions/logout?${params.toString()}`;
	} catch {
		return null;
	}
};
