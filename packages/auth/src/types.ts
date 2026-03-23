/** @format */

export type AuthMembershipStatus = "active" | "inactive" | "pending";

export interface AuthUser {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	emailVerified: boolean;
	profilePictureUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AuthOrganization {
	id: string;
	name: string;
	createdAt: string;
	updatedAt: string;
}

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

export interface AuthSessionWithoutMemberships extends Omit<
	AuthSession,
	"memberships"
> {}

export type AuthSessionFailureReason =
	| "missing_session"
	| "no_session_cookie_provided"
	| "invalid_session"
	| "session_expired"
	| "authentication_failed";

export interface AuthenticatedSessionResult {
	authenticated: true;
	refreshed: boolean;
	reason: null;
	sealedSession: string | null;
	session: AuthSession;
}

export interface UnauthenticatedSessionResult {
	authenticated: false;
	refreshed: false;
	reason: AuthSessionFailureReason;
	sealedSession: null;
	session: null;
}

export type AuthSessionResult =
	| AuthenticatedSessionResult
	| UnauthenticatedSessionResult;

export interface AuthAuthorizationUrlInput {
	redirectUri: string;
	organizationId?: string;
	state?: string;
	screenHint?: "sign-in" | "sign-up";
}

export interface AuthExchangeInput {
	code: string;
	ipAddress?: string;
	userAgent?: string;
	preferredOrganizationId?: string;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthProvisioningAdapter;
}

export interface AuthExchangeResult {
	sealedSession: string;
	session: AuthSession;
}

export interface AuthSessionCookieInput {
	sealedSession: string | undefined;
	preferredOrganizationId?: string;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthProvisioningAdapter;
}

export interface AuthOrganizationListInput {
	limit?: number;
	before?: string;
	after?: string;
}

export interface AuthOrganizationListResult {
	data: AuthOrganization[];
	before: string | null;
	after: string | null;
}

export interface AuthRuntimeObserverEvent {
	type:
		| "auth.retry"
		| "auth.login.completed"
		| "auth.login.provisioned"
		| "auth.session.authenticated"
		| "auth.session.refreshed"
		| "auth.session.cleared"
		| "auth.memberships.resolved";
	operation: string;
	attempt?: number;
	detail?: string;
}

export interface AuthRuntimeObserver {
	(event: AuthRuntimeObserverEvent): void;
}

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

export interface WorkOSAuthEnv {
	PRIVATE_WORKOS_CLIENT_ID: string;
	PRIVATE_WORKOS_API_KEY: string;
	PRIVATE_WORKOS_COOKIE_PASSWORD: string;
	PRIVATE_WORKOS_ORG_ID?: string;
}

export interface AuthTransportSessionAuthentication {
	authenticated: true;
	session: AuthSessionWithoutMemberships;
}

export interface AuthTransportSessionAuthenticationFailure {
	authenticated: false;
	reason: AuthSessionFailureReason;
}

export type AuthTransportSessionAuthenticateResult =
	| AuthTransportSessionAuthentication
	| AuthTransportSessionAuthenticationFailure;

export interface AuthTransportSessionRefresh {
	authenticated: true;
	sealedSession: string;
	session: AuthSessionWithoutMemberships;
}

export interface AuthTransportSessionRefreshFailure {
	authenticated: false;
	reason: AuthSessionFailureReason;
}

export type AuthTransportSessionRefreshResult =
	| AuthTransportSessionRefresh
	| AuthTransportSessionRefreshFailure;

export interface AuthTransportSession {
	authenticate(): Promise<AuthTransportSessionAuthenticateResult>;
	refresh(input?: {
		organizationId?: string;
	}): Promise<AuthTransportSessionRefreshResult>;
	getLogoutUrl(input?: { returnTo?: string }): Promise<string>;
}

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
	loadSealedSession(input: {
		sealedSession: string | undefined;
		cookiePassword: string;
	}): Promise<AuthTransportSession>;
	getUser(input: { userId: string }): Promise<AuthUser>;
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

export interface AuthProvisioningRequest {
	session: AuthSession;
	fallbackOrganizationId?: string;
}

export interface AuthProvisioningResult {
	activeOrganizationId: string;
	organizationIds: string[];
}

export interface AuthProvisioningAdapter {
	provision(
		input: AuthProvisioningRequest,
	): Promise<AuthProvisioningResult>;
}
