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
	authenticateWithPassword: async ({ email }) => ({
		id: "user_123",
		email,
		firstName: "Mia",
		lastName: "Example",
		emailVerified: true,
		profilePictureUrl: null,
		organizationId: "org_primary",
		createdAt: "2026-03-23T00:00:00.000Z",
		updatedAt: "2026-03-23T00:00:00.000Z",
	}),
	updateUserPassword: async ({ userId }) => ({
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
		const authenticateWithCode = vi.fn(async () => {
			throw new RetryableAuthError(
				"temporary failure",
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

	it("honors zero retry options from env config", async () => {
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
				transport: createTransport({
					authenticateWithCode,
				}),
				retryAttempts: 0,
				retryBaseDelayMs: 0,
			},
		);

		await expect(
			runtime.authenticateWithCode({ code: "retry_never" }),
		).rejects.toBeInstanceOf(RetryableAuthError);
		expect(authenticateWithCode).toHaveBeenCalledOnce();
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

	it("refreshes the sealed session when provisioning changes the active organization", async () => {
		const refresh = vi.fn(async () => ({
			authenticated: true as const,
			sealedSession: "sealed_org_provisioned",
			session: {
				...baseSession(),
				organizationId: "org_provisioned",
			},
		}));
		const transport = createTransport({
			authenticateWithCode: async () => ({
				sealedSession: "sealed_session",
				session: {
					...baseSession(),
					organizationId: null,
				},
			}),
			loadSealedSession: async () => ({
				authenticate: async () => ({
					authenticated: true,
					session: baseSession(),
				}),
				refresh,
				getLogoutUrl: async () =>
					"https://example.com/logout",
			}),
			listOrganizationMemberships: async () => [],
		});
		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			defaultOrganizationId: "org_provisioned",
			transport,
		});

		const result = await runtime.authenticateWithCode({
			code: "code_123",
			provisioningAdapter: {
				provision: async () => ({
					activeOrganizationId: "org_provisioned",
					organizationIds: ["org_provisioned"],
				}),
			},
		});

		expect(result.sealedSession).toBe("sealed_org_provisioned");
		expect(refresh).toHaveBeenCalledWith({
			organizationId: "org_provisioned",
		});
	});

	it("normalizes plain provisioning errors", async () => {
		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport: createTransport(),
		});

		await expect(
			runtime.authenticateWithCode({
				code: "code_123",
				provisioningAdapter: {
					provision: async () => {
						throw new Error("db offline");
					},
				},
			}),
		).rejects.toMatchObject({
			operation: "provision",
		});
	});

	it("verifies the current password before changing it", async () => {
		const authenticateWithPassword = vi.fn(async ({ email }) => ({
			id: "user_123",
			email,
			firstName: "Mia",
			lastName: "Example",
			emailVerified: true,
			profilePictureUrl: null,
			organizationId: "org_primary",
			createdAt: "2026-03-23T00:00:00.000Z",
			updatedAt: "2026-03-23T00:00:00.000Z",
		}));
		const updateUserPassword = vi.fn(async ({ userId }) => ({
			id: userId,
			email: "mia@example.com",
			firstName: "Mia",
			lastName: "Example",
			emailVerified: true,
			profilePictureUrl: null,
			organizationId: "org_primary",
			createdAt: "2026-03-23T00:00:00.000Z",
			updatedAt: "2026-03-23T00:00:00.000Z",
		}));
		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport: createTransport({
				authenticateWithPassword,
				updateUserPassword,
			}),
		});

		await expect(
			runtime.changePassword({
				userId: "user_123",
				email: "mia@example.com",
				currentPassword: "old-password",
				newPassword: "new-password",
			}),
		).resolves.toMatchObject({ id: "user_123" });
		expect(authenticateWithPassword).toHaveBeenCalledWith({
			email: "mia@example.com",
			password: "old-password",
		});
		expect(updateUserPassword).toHaveBeenCalledWith({
			userId: "user_123",
			password: "new-password",
		});
	});

	it("rejects password changes authenticated as another user", async () => {
		const updateUserPassword = vi.fn();
		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport: createTransport({
				authenticateWithPassword: async ({
					email,
				}) => ({
					id: "user_other",
					email,
					firstName: "Mallory",
					lastName: "Example",
					emailVerified: true,
					profilePictureUrl: null,
					organizationId: "org_primary",
					createdAt: "2026-03-23T00:00:00.000Z",
					updatedAt: "2026-03-23T00:00:00.000Z",
				}),
				updateUserPassword,
			}),
		});

		await expect(
			runtime.changePassword({
				userId: "user_123",
				email: "mia@example.com",
				currentPassword: "old-password",
				newPassword: "new-password",
			}),
		).rejects.toBeInstanceOf(TerminalAuthError);
		expect(updateUserPassword).not.toHaveBeenCalled();
	});

	it("rejects empty organization update names", async () => {
		const updateOrganization = vi.fn();
		const runtime = createAuthRuntime({
			clientId: "client_123",
			apiKey: "sk_test",
			cookiePassword:
				"test-password-that-is-at-least-32-chars-long!!",
			transport: createTransport({ updateOrganization }),
		});

		await expect(
			runtime.updateOrganization({
				organizationId: "org_123",
				name: " ",
			}),
		).rejects.toBeInstanceOf(TerminalAuthError);
		expect(updateOrganization).not.toHaveBeenCalled();
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
