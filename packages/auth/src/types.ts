/** @format */

/** WorkOS organization membership states exposed by the shared auth boundary. */
export type AuthMembershipStatus = "active" | "inactive" | "pending";

/** User profile fields normalized from WorkOS user responses. */
export interface AuthUser {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	emailVerified: boolean;
	profilePictureUrl: string | null;
	organizationId: string | null;
	createdAt: string;
	updatedAt: string;
}

/** Organization fields normalized from WorkOS organization responses. */
export interface AuthOrganization {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

/** A user's relationship to an organization, including role and status metadata. */
export interface AuthOrganizationMembership {
	id: string;
	userId: string;
	organizationId: string;
	organizationName: string | null;
	status: AuthMembershipStatus;
	directoryManaged: boolean;
	roleSlug: string | null;
	createdAt: string;
	updatedAt: string;
}

/** TOTP metadata attached to a WorkOS authentication factor. */
export interface AuthTotpFactorDetails {
	issuer: string;
	user: string;
	qrCode?: string;
	secret?: string;
	uri?: string;
}

/** Authentication factor normalized from WorkOS user-management MFA APIs. */
export interface AuthFactor {
	id: string;
	userId: string | null;
	type: "totp";
	totp: AuthTotpFactorDetails;
	createdAt: string;
	updatedAt: string;
}

/** Authentication challenge returned when enrolling a new factor. */
export interface AuthFactorChallenge {
	id: string;
	authenticationFactorId: string;
	createdAt: string;
	updatedAt: string;
	expiresAt: string | null;
}

/** Result for creating a TOTP factor that still needs user verification. */
export interface AuthTotpEnrollment {
	factor: AuthFactor;
	challenge: AuthFactorChallenge;
}

/** Result for verifying an auth-factor challenge code. */
export interface AuthFactorChallengeVerification {
	challenge: AuthFactorChallenge;
	valid: boolean;
}

/** Application session claims normalized from a WorkOS sealed session. */
export interface AuthSession {
	sessionId: string | null;
	userId: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	emailVerified: boolean;
	profilePictureUrl: string | null;
	organizationId: string | null;
	roleSlug: string | null;
	permissions: string[];
	entitlements: string[];
	memberships: AuthOrganizationMembership[];
}

/** Session claims before optional organization membership enrichment. */
export type AuthSessionWithoutMemberships = Omit<AuthSession, "memberships">;

/** Stable failure reasons returned when a sealed session cannot authenticate. */
export type AuthSessionFailureReason =
	| "missing_session"
	| "no_session_cookie_provided"
	| "invalid_session"
	| "session_expired"
	| "authentication_failed";

/** Successful sealed-session authentication result. */
export interface AuthenticatedSessionResult {
	authenticated: true;
	refreshed: boolean;
	reason: null;
	sealedSession: string | null;
	session: AuthSession;
}

/** Failed sealed-session authentication result. */
export interface UnauthenticatedSessionResult {
	authenticated: false;
	refreshed: false;
	reason: AuthSessionFailureReason;
	sealedSession: null;
	session: null;
}

/** Discriminated result for sealed-session authentication. */
export type AuthSessionResult =
	| AuthenticatedSessionResult
	| UnauthenticatedSessionResult;

/** Inputs for building a WorkOS AuthKit authorization URL. */
export interface AuthAuthorizationUrlInput {
	redirectUri: string;
	organizationId?: string;
	state?: string;
	screenHint?: "sign-in" | "sign-up";
}

/** Inputs for exchanging an OAuth authorization code for a sealed session. */
export interface AuthExchangeInput {
	code: string;
	ipAddress?: string;
	userAgent?: string;
	preferredOrganizationId?: string;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthProvisioningAdapter;
}

/** Successful OAuth exchange output, including the cookie-ready sealed session. */
export interface AuthExchangeResult {
	sealedSession: string;
	session: AuthSession;
}

/** Inputs for authenticating or refreshing an existing sealed-session cookie. */
export interface AuthSessionCookieInput {
	sealedSession: string | undefined;
	preferredOrganizationId?: string;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthProvisioningAdapter;
}

/** Cursor pagination input for listing organizations. */
export interface AuthOrganizationListInput {
	limit?: number;
	before?: string;
	after?: string;
}

/** Cursor pagination result for organization listings. */
export interface AuthOrganizationListResult {
	data: AuthOrganization[];
	before: string | null;
	after: string | null;
}

/** Observability event emitted by the auth runtime for retries and session work. */
export interface AuthRuntimeObserverEvent {
	type:
		| "auth.retry"
		| "auth.login.completed"
		| "auth.login.provisioned"
		| "auth.session.authenticated"
		| "auth.session.refreshed"
		| "auth.memberships.resolved";
	operation: string;
	attempt?: number;
	detail?: string;
}

/** Callback for auth runtime telemetry. Must not throw. */
export interface AuthRuntimeObserver {
	(event: AuthRuntimeObserverEvent): void;
}

/** Configuration for the shared auth runtime and retry policy. */
export interface AuthRuntimeConfig {
	clientId: string;
	apiKey: string;
	cookiePassword: string;
	defaultOrganizationId?: string;
	retryAttempts?: number;
	retryBaseDelayMs?: number;
	observer?: AuthRuntimeObserver;
	transport?: AuthTransport;
}

/** Environment binding names used by SvelteKit/private WorkOS configuration. */
export interface WorkOSAuthEnv {
	PRIVATE_WORKOS_CLIENT_ID: string;
	PRIVATE_WORKOS_API_KEY: string;
	PRIVATE_WORKOS_COOKIE_PASSWORD: string;
	PRIVATE_WORKOS_ORG_ID?: string;
}

/** Successful transport-level sealed-session authentication. */
export interface AuthTransportSessionAuthentication {
	authenticated: true;
	session: AuthSessionWithoutMemberships;
}

/** Failed transport-level sealed-session authentication. */
export interface AuthTransportSessionAuthenticationFailure {
	authenticated: false;
	reason: AuthSessionFailureReason;
}

/** Transport result for authenticating loaded sealed sessions. */
export type AuthTransportSessionAuthenticateResult =
	| AuthTransportSessionAuthentication
	| AuthTransportSessionAuthenticationFailure;

/** Successful transport-level session refresh. */
export interface AuthTransportSessionRefresh {
	authenticated: true;
	sealedSession: string;
	session: AuthSessionWithoutMemberships;
}

/** Failed transport-level session refresh. */
export interface AuthTransportSessionRefreshFailure {
	authenticated: false;
	reason: AuthSessionFailureReason;
}

/** Transport result for refreshing loaded sealed sessions. */
export type AuthTransportSessionRefreshResult =
	| AuthTransportSessionRefresh
	| AuthTransportSessionRefreshFailure;

/** Loaded sealed-session operations supplied by an auth transport. */
export interface AuthTransportSession {
	authenticate(): Promise<AuthTransportSessionAuthenticateResult>;
	refresh(input?: {
		organizationId?: string;
	}): Promise<AuthTransportSessionRefreshResult>;
	getLogoutUrl(input?: { returnTo?: string }): Promise<string>;
}

/** Boundary implemented by WorkOS or test transports used by the runtime. */
export interface AuthTransport {
	getAuthorizationUrl(input: AuthAuthorizationUrlInput): string;
	authenticateWithCode(input: {
		code: string;
		cookiePassword: string;
		ipAddress?: string;
		userAgent?: string;
	}): Promise<{
		sealedSession: string;
		session: AuthSessionWithoutMemberships;
	}>;
	authenticateWithPassword(input: {
		email: string;
		password: string;
		ipAddress?: string;
		userAgent?: string;
	}): Promise<AuthUser>;
	loadSealedSession(input: {
		sealedSession: string | undefined;
		cookiePassword: string;
	}): Promise<AuthTransportSession>;
	getUser(input: { userId: string }): Promise<AuthUser>;
	updateUserDetails(input: {
		userId: string;
		email?: string;
		firstName?: string | null;
		lastName?: string | null;
	}): Promise<AuthUser>;
	updateUserPassword(input: {
		userId: string;
		password: string;
	}): Promise<AuthUser>;
	listAuthFactors(input: { userId: string }): Promise<AuthFactor[]>;
	enrollTotpFactor(input: {
		userId: string;
		issuer?: string;
		label?: string;
	}): Promise<AuthTotpEnrollment>;
	verifyAuthFactorChallenge(input: {
		challengeId: string;
		code: string;
	}): Promise<AuthFactorChallengeVerification>;
	deleteAuthFactor(input: { factorId: string }): Promise<void>;
	getOrganization(input: {
		organizationId: string;
	}): Promise<AuthOrganization>;
	listOrganizations(
		input?: AuthOrganizationListInput,
	): Promise<AuthOrganizationListResult>;
	createOrganization(input: { name: string }): Promise<AuthOrganization>;
	updateOrganization(input: {
		organizationId: string;
		name?: string;
	}): Promise<AuthOrganization>;
	deleteOrganization(input: { organizationId: string }): Promise<void>;
	listOrganizationMemberships(input: {
		userId?: string;
		organizationId?: string;
		statuses?: AuthMembershipStatus[];
	}): Promise<AuthOrganizationMembership[]>;
}

/** Data passed to app-specific provisioning after authentication succeeds. */
export interface AuthProvisioningRequest {
	session: AuthSession;
	fallbackOrganizationId?: string;
}

/** Local provisioning result used to resolve the session's active org. */
export interface AuthProvisioningResult {
	activeOrganizationId: string;
	organizationIds: string[];
}

/** App-owned provisioning adapter invoked by the auth runtime after login/session auth. */
export interface AuthProvisioningAdapter {
	provision(
		input: AuthProvisioningRequest,
	): Promise<AuthProvisioningResult>;
}
