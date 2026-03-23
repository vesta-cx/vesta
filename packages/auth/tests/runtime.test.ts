/** @format */

import { describe, expect, it, vi } from "vitest";
import {
	createAuthRuntime,
	createAuthRuntimeFromEnv,
	type AuthTransport,
	type AuthTransportSession,
	type AuthSessionWithoutMemberships,
	RetryableAuthError,
	TerminalAuthError,
} from "../src/index.js";

const baseSession = (): AuthSessionWithoutMemberships => ({
	sessionId: "sess_123",
	userId: "user_123",
	email: "mia@example.com",
	firstName: "Mia",
	lastName: "Example",
	emailVerified: true,
	profilePictureUrl: null,
	organizationId: "org_primary",
	roleSlug: "member",
	permissions: ["read:all"],
	entitlements: [],
});

const defaultTransportSession = (): AuthTransportSession => ({
	authenticate: async () => ({
		authenticated: true,
		session: baseSession(),
	}),
	refresh: async () => ({
		authenticated: true,
		sealedSession: "sealed_refreshed",
		session: baseSession(),
	}),
	getLogoutUrl: async () => "https://example.com/logout",
});

const createTransport = (
	overrides?: Partial<AuthTransport>,
): AuthTransport => ({
	getAuthorizationUrl: () => "https://example.com/login",
	authenticateWithCode: async () => ({
		sealedSession: "sealed_session",
		session: baseSession(),
	}),
	loadSealedSession: async () => defaultTransportSession(),
	getUser: async ({ userId }) => ({
		id: userId,
		email: "mia@example.com",
		firstName: "Mia",
		lastName: "Example",
		emailVerified: true,
		profilePictureUrl: null,
		organizationId: "org_primary",
		createdAt: "2026-03-23T00:00:00.000Z",
		updatedAt: "2026-03-23T00:00:00.000Z",
	}),
	getOrganization: async ({ organizationId }) => ({
		id: organizationId,
		name: "Primary Org",
		createdAt: "2026-03-23T00:00:00.000Z",
		updatedAt: "2026-03-23T00:00:00.000Z",
	}),
	listOrganizations: async () => ({
		data: [],
		before: null,
		after: null,
	}),
	createOrganization: async ({ name }) => ({
		id: "org_created",
		name,
		createdAt: "2026-03-23T00:00:00.000Z",
		updatedAt: "2026-03-23T00:00:00.000Z",
	}),
	updateOrganization: async ({ organizationId, name }) => ({
		id: organizationId,
		name: name ?? "Updated Org",
		createdAt: "2026-03-23T00:00:00.000Z",
		updatedAt: "2026-03-23T00:00:00.000Z",
	}),
	deleteOrganization: async () => undefined,
	listOrganizationMemberships: async ({ userId }) => [
		{
			id: "om_123",
			userId: userId ?? "user_123",
			organizationId: "org_primary",
			organizationName: "Primary Org",
			status: "active",
			directoryManaged: false,
			roleSlug: "member",
			createdAt: "2026-03-23T00:00:00.000Z",
			updatedAt: "2026-03-23T00:00:00.000Z",
		},
	],
	...overrides,
});

describe("createAuthRuntime", () => {
	it("retries retryable auth failures", async () => {
		let attempts = 0;
		const transport = createTransport({
			authenticateWithCode: async () => {
				attempts += 1;
				if (attempts === 1) {
					throw new RetryableAuthError(
						"temporary failure",
						"authenticateWithCode",
					);
				}

				return {
					sealedSession: "sealed_session",
					session: baseSession(),
				};
			},
		});

		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport,
			retryBaseDelayMs: 1,
		});

		const result = await runtime.authenticateWithCode({
			code: "code_123",
		});

		expect(attempts).toBe(2);
		expect(result.session.userId).toBe("user_123");
		expect(result.session.memberships).toHaveLength(1);
	});

	it("does not retry terminal auth failures", async () => {
		const authenticateWithCode = vi.fn(async () => {
			throw new TerminalAuthError(
				"invalid code",
				"authenticateWithCode",
			);
		});

		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport: createTransport({
				authenticateWithCode,
			}),
			retryBaseDelayMs: 1,
		});

		await expect(
			runtime.authenticateWithCode({
				code: "bad_code",
			}),
		).rejects.toBeInstanceOf(TerminalAuthError);
		expect(authenticateWithCode).toHaveBeenCalledTimes(1);
	});

	it("treats retryAttempts as the number of retries", async () => {
		let attempts = 0;
		const authenticateWithCode = vi.fn(async () => {
			attempts += 1;
			if (attempts <= 2) {
				throw new RetryableAuthError(
					"temporary failure",
					"authenticateWithCode",
				);
			}

			return {
				sealedSession: "sealed_session",
				session: baseSession(),
			};
		});

		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport: createTransport({
				authenticateWithCode,
			}),
			retryAttempts: 1,
			retryBaseDelayMs: 1,
		});

		await expect(
			runtime.authenticateWithCode({
				code: "retry_once",
			}),
		).rejects.toBeInstanceOf(RetryableAuthError);
		expect(authenticateWithCode).toHaveBeenCalledTimes(2);
	});

	it("preserves retryAttempts=0 from env options", async () => {
		const authenticateWithCode = vi.fn(async () => {
			throw new RetryableAuthError(
				"temporary failure",
				"authenticateWithCode",
			);
		});

		const runtime = createAuthRuntimeFromEnv(
			{
				PRIVATE_WORKOS_CLIENT_ID: "client_123",
				PRIVATE_WORKOS_API_KEY: "sk_test",
				PRIVATE_WORKOS_COOKIE_PASSWORD:
					"test-password-that-is-at-least-32-chars-long!!",
			},
			{
				retryAttempts: 0,
				retryBaseDelayMs: 1,
				transport: createTransport({
					authenticateWithCode,
				}),
			},
		);

		await expect(
			runtime.authenticateWithCode({
				code: "no_retry",
			}),
		).rejects.toBeInstanceOf(RetryableAuthError);
		expect(authenticateWithCode).toHaveBeenCalledTimes(1);
	});

	it("applies the provisioning adapter after a successful exchange", async () => {
		const provision = vi.fn(async () => ({
			activeOrganizationId: "org_provisioned",
			organizationIds: ["org_primary", "org_provisioned"],
		}));

		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport: createTransport(),
		});

		const result = await runtime.authenticateWithCode({
			code: "code_123",
			provisioningAdapter: { provision },
		});

		expect(provision).toHaveBeenCalledOnce();
		expect(result.session.organizationId).toBe("org_provisioned");
	});

	it("refreshes an invalid sealed session", async () => {
		const transport = createTransport({
			loadSealedSession: async () => ({
				authenticate: async () => ({
					authenticated: false,
					reason: "invalid_session",
				}),
				refresh: async () => ({
					authenticated: true,
					sealedSession: "sealed_refreshed",
					session: {
						...baseSession(),
						organizationId: "org_refreshed",
					},
				}),
				getLogoutUrl: async () =>
					"https://example.com/logout",
			}),
			listOrganizationMemberships: async ({ userId }) => [
				{
					id: "om_456",
					userId: userId ?? "user_123",
					organizationId: "org_refreshed",
					organizationName: "Refreshed Org",
					status: "active",
					directoryManaged: false,
					roleSlug: "admin",
					createdAt: "2026-03-23T00:00:00.000Z",
					updatedAt: "2026-03-23T00:00:00.000Z",
				},
			],
		});

		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport,
		});

		const result = await runtime.authenticateSealedSession({
			sealedSession: "sealed_old",
			resolveMemberships: true,
		});

		expect(result.authenticated).toBe(true);
		if (result.authenticated) {
			expect(result.refreshed).toBe(true);
			expect(result.sealedSession).toBe("sealed_refreshed");
			expect(result.session.organizationId).toBe(
				"org_refreshed",
			);
		}
	});
});
