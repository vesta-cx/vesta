/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

const listOrganizationMembershipsMock = vi.fn();
const authenticateWithCodeMock = vi.fn();
const authenticateWithPasswordMock = vi.fn();
const updateUserMock = vi.fn();
const listAuthFactorsMock = vi.fn();
const enrollAuthFactorMock = vi.fn();
const deleteFactorMock = vi.fn();
const challengeFactorMock = vi.fn();
const verifyChallengeMock = vi.fn();
const loadSealedSessionMock = vi.fn();
const listOrganizationsMock = vi.fn();

vi.mock("@workos-inc/node", () => ({
	WorkOS: class {
		userManagement = {
			listOrganizationMemberships:
				listOrganizationMembershipsMock,
			authenticateWithCode: authenticateWithCodeMock,
			authenticateWithPassword: authenticateWithPasswordMock,
			updateUser: updateUserMock,
			listAuthFactors: listAuthFactorsMock,
			enrollAuthFactor: enrollAuthFactorMock,
			loadSealedSession: loadSealedSessionMock,
		};

		mfa = {
			deleteFactor: deleteFactorMock,
			challengeFactor: challengeFactorMock,
			verifyChallenge: verifyChallengeMock,
		};

		organizations = {
			listOrganizations: listOrganizationsMock,
		};

		constructor(_apiKey: string) {}
	},
}));

import { createWorkOSTransport } from "../src/workos-transport.js";

describe("createWorkOSTransport", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.unstubAllGlobals();
	});

	it("hydrates login sessions from the sealed session claims", async () => {
		authenticateWithCodeMock.mockResolvedValueOnce({
			user: {
				id: "user_123",
				email: "mia@example.com",
				first_name: "Mia",
				last_name: "Example",
				email_verified: true,
				created_at: "2026-03-24T00:00:00.000Z",
				updated_at: "2026-03-24T00:00:00.000Z",
			},
			sealed_session: "sealed_123",
			access_token: "access_123",
		});
		loadSealedSessionMock.mockResolvedValueOnce({
			authenticate: async () => ({
				authenticated: true,
				session_id: "sess_123",
				organization_id: "org_123",
				role: "member",
				permissions: ["posts:create"],
				entitlements: ["audit-logs"],
				user: {
					id: "user_123",
					email: "mia@example.com",
					first_name: "Mia",
					last_name: "Example",
					email_verified: true,
					created_at: "2026-03-24T00:00:00.000Z",
					updated_at: "2026-03-24T00:00:00.000Z",
				},
			}),
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.authenticateWithCode({
				code: "code_123",
				cookiePassword:
					"test-password-that-is-at-least-32-chars-long!!",
			}),
		).resolves.toEqual({
			sealedSession: "sealed_123",
			session: expect.objectContaining({
				sessionId: "sess_123",
				organizationId: "org_123",
				roleSlug: "member",
				permissions: ["posts:create"],
				entitlements: ["audit-logs"],
			}),
		});
	});

	it("authenticates a user with password without sealing a new session", async () => {
		authenticateWithPasswordMock.mockResolvedValueOnce({
			user: {
				id: "user_123",
				email: "mia@example.com",
				first_name: "Mia",
				last_name: "Example",
				email_verified: true,
				created_at: "2026-03-24T00:00:00.000Z",
				updated_at: "2026-03-24T00:00:00.000Z",
			},
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.authenticateWithPassword({
				email: "mia@example.com",
				password: "current-password",
			}),
		).resolves.toMatchObject({
			id: "user_123",
			email: "mia@example.com",
		});
		expect(authenticateWithPasswordMock).toHaveBeenCalledWith({
			clientId: "client_123",
			email: "mia@example.com",
			password: "current-password",
		});
	});

	it("updates WorkOS-owned user details", async () => {
		updateUserMock.mockResolvedValueOnce({
			id: "user_123",
			email: "new@example.com",
			first_name: "New",
			last_name: "Name",
			email_verified: false,
			created_at: "2026-03-24T00:00:00.000Z",
			updated_at: "2026-03-24T00:00:00.000Z",
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.updateUserDetails({
				userId: "user_123",
				email: "new@example.com",
				firstName: "New",
				lastName: "Name",
			}),
		).resolves.toMatchObject({
			email: "new@example.com",
			firstName: "New",
			lastName: "Name",
		});
		expect(updateUserMock).toHaveBeenCalledWith({
			userId: "user_123",
			email: "new@example.com",
			firstName: "New",
			lastName: "Name",
		});
	});

	it("sends email change codes through the WorkOS API", async () => {
		const fetchMock = vi.fn(async () =>
			Response.json({
				object: "email_change",
				user: {
					id: "user_123",
					email: "current@example.com",
					first_name: "Mia",
					last_name: "Example",
					email_verified: true,
					created_at: "2026-03-24T00:00:00.000Z",
					updated_at: "2026-03-24T00:00:00.000Z",
				},
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.sendEmailChangeCode({
				userId: "user_123",
				newEmail: "new@example.com",
			}),
		).resolves.toMatchObject({
			email: "current@example.com",
			emailVerified: true,
		});
		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.workos.com/user_management/users/user_123/email_change/send",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({
					new_email: "new@example.com",
				}),
			}),
		);
	});

	it("confirms email changes through the WorkOS API", async () => {
		const fetchMock = vi.fn(async () =>
			Response.json({
				object: "email_change_confirmation",
				user: {
					id: "user_123",
					email: "new@example.com",
					first_name: "Mia",
					last_name: "Example",
					email_verified: true,
					created_at: "2026-03-24T00:00:00.000Z",
					updated_at: "2026-03-24T00:00:00.000Z",
				},
			}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.confirmEmailChange({
				userId: "user_123",
				code: "123456",
			}),
		).resolves.toMatchObject({
			email: "new@example.com",
			emailVerified: true,
		});
		expect(fetchMock).toHaveBeenCalledWith(
			"https://api.workos.com/user_management/users/user_123/email_change/confirm",
			expect.objectContaining({
				method: "POST",
				body: JSON.stringify({ code: "123456" }),
			}),
		);
	});

	it("updates a user's password through WorkOS user management", async () => {
		updateUserMock.mockResolvedValueOnce({
			id: "user_123",
			email: "mia@example.com",
			first_name: "Mia",
			last_name: "Example",
			email_verified: true,
			created_at: "2026-03-24T00:00:00.000Z",
			updated_at: "2026-03-24T00:00:00.000Z",
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.updateUserPassword({
				userId: "user_123",
				password: "new-password",
			}),
		).resolves.toMatchObject({ id: "user_123" });
		expect(updateUserMock).toHaveBeenCalledWith({
			userId: "user_123",
			password: "new-password",
		});
	});

	it("lists user auth factors through WorkOS user management", async () => {
		listAuthFactorsMock.mockResolvedValueOnce({
			data: [
				{
					id: "factor_totp",
					user_id: "user_123",
					type: "totp",
					totp: {
						issuer: "Vesta",
						user: "mia@example.com",
					},
					created_at: "2026-03-24T00:00:00.000Z",
					updated_at: "2026-03-24T00:00:00.000Z",
				},
			],
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.listAuthFactors({ userId: "user_123" }),
		).resolves.toEqual([
			expect.objectContaining({
				id: "factor_totp",
				userId: "user_123",
				type: "totp",
			}),
		]);
		expect(listAuthFactorsMock).toHaveBeenCalledWith({
			userId: "user_123",
		});
	});

	it("deduplicates auth factors returned by WorkOS", async () => {
		const factor = {
			id: "factor_totp",
			user_id: "user_123",
			type: "totp",
			totp: {
				issuer: "Vesta",
				user: "mia@example.com",
			},
			created_at: "2026-03-24T00:00:00.000Z",
			updated_at: "2026-03-24T00:00:00.000Z",
		};
		listAuthFactorsMock.mockResolvedValueOnce({
			data: [factor, factor],
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.listAuthFactors({ userId: "user_123" }),
		).resolves.toHaveLength(1);
	});

	it("enrolls TOTP factors through WorkOS user management", async () => {
		enrollAuthFactorMock.mockResolvedValueOnce({
			authentication_factor: {
				id: "factor_totp",
				user_id: "user_123",
				type: "totp",
				totp: {
					issuer: "Vesta",
					user: "mia@example.com",
					qr_code: "data:image/png;base64,abc",
					secret: "SECRET",
					uri: "otpauth://totp/Vesta:mia@example.com",
				},
				created_at: "2026-03-24T00:00:00.000Z",
				updated_at: "2026-03-24T00:00:00.000Z",
			},
			authentication_challenge: {
				id: "challenge_totp",
				authentication_factor_id: "factor_totp",
				created_at: "2026-03-24T00:00:00.000Z",
				updated_at: "2026-03-24T00:00:00.000Z",
			},
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.enrollTotpFactor({
				userId: "user_123",
				issuer: "Vesta",
				label: "mia@example.com",
			}),
		).resolves.toMatchObject({
			factor: { id: "factor_totp" },
			challenge: { id: "challenge_totp" },
		});
		expect(enrollAuthFactorMock).toHaveBeenCalledWith({
			userId: "user_123",
			type: "totp",
			totpIssuer: "Vesta",
			totpUser: "mia@example.com",
		});
	});

	it("creates auth factor challenges through the MFA API", async () => {
		challengeFactorMock.mockResolvedValueOnce({
			id: "challenge_fresh",
			authentication_factor_id: "factor_totp",
			created_at: "2026-03-24T00:00:00.000Z",
			updated_at: "2026-03-24T00:00:00.000Z",
		});
		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.challengeAuthFactor({
				factorId: "factor_totp",
			}),
		).resolves.toMatchObject({ id: "challenge_fresh" });
		expect(challengeFactorMock).toHaveBeenCalledWith({
			authenticationFactorId: "factor_totp",
		});
	});

	it("verifies auth factor challenges through the MFA API", async () => {
		verifyChallengeMock.mockResolvedValueOnce({
			challenge: {
				id: "challenge_totp",
				authentication_factor_id: "factor_totp",
				created_at: "2026-03-24T00:00:00.000Z",
				updated_at: "2026-03-24T00:00:00.000Z",
			},
			valid: true,
		});
		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.verifyAuthFactorChallenge({
				challengeId: "challenge_totp",
				code: "123456",
			}),
		).resolves.toMatchObject({ valid: true });
		expect(verifyChallengeMock).toHaveBeenCalledWith({
			authenticationChallengeId: "challenge_totp",
			code: "123456",
		});
	});

	it("deletes auth factors through the MFA API", async () => {
		const transport = createWorkOSTransport({
			apiKey: "sk_test",
			clientId: "client_123",
		});

		await expect(
			transport.deleteAuthFactor({ factorId: "factor_totp" }),
		).resolves.toBeUndefined();
		expect(deleteFactorMock).toHaveBeenCalledWith("factor_totp");
	});

	it("keeps pagination metadata when only an after cursor is present", async () => {
		listOrganizationsMock.mockResolvedValueOnce({
			data: [],
			listMetadata: {
				after: "org_after",
				before: null,
			},
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
		});

		await expect(transport.listOrganizations()).resolves.toEqual({
			data: [],
			before: null,
			after: "org_after",
		});
	});

	it("auto-paginates organization memberships before mapping them", async () => {
		const autoPagination = vi.fn(async () => [
			{
				id: "om_123",
				user_id: "user_123",
				organization_id: "org_123",
				status: "active",
				created_at: "2026-03-24T00:00:00.000Z",
				updated_at: "2026-03-24T00:00:00.000Z",
			},
			{
				id: "om_456",
				user_id: "user_123",
				organization_id: "org_456",
				status: "pending",
				created_at: "2026-03-24T00:00:00.000Z",
				updated_at: "2026-03-24T00:00:00.000Z",
			},
		]);

		listOrganizationMembershipsMock.mockResolvedValueOnce({
			data: [
				{
					id: "om_first_page",
					user_id: "user_123",
					organization_id: "org_first_page",
					status: "active",
					created_at: "2026-03-24T00:00:00.000Z",
					updated_at: "2026-03-24T00:00:00.000Z",
				},
			],
			autoPagination,
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
		});

		await expect(
			transport.listOrganizationMemberships({
				userId: "user_123",
			}),
		).resolves.toEqual([
			expect.objectContaining({
				id: "om_123",
				organizationId: "org_123",
			}),
			expect.objectContaining({
				id: "om_456",
				organizationId: "org_456",
			}),
		]);
		expect(autoPagination).toHaveBeenCalledOnce();
	});

	it("throws when a membership status is missing or unknown", async () => {
		listOrganizationMembershipsMock.mockResolvedValueOnce({
			data: [
				{
					id: "om_123",
					user_id: "user_123",
					organization_id: "org_123",
					status: "surprise",
					created_at: "2026-03-24T00:00:00.000Z",
					updated_at: "2026-03-24T00:00:00.000Z",
				},
			],
		});

		const transport = createWorkOSTransport({
			apiKey: "sk_test",
		});

		await expect(
			transport.listOrganizationMemberships({
				userId: "user_123",
			}),
		).rejects.toThrow(
			'toAuthOrganizationMembership: invalid status "surprise"',
		);
	});
});
