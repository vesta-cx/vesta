/** @format */

import { beforeEach, describe, expect, it, vi } from "vitest";

const listOrganizationMembershipsMock = vi.fn();
const authenticateWithCodeMock = vi.fn();
const loadSealedSessionMock = vi.fn();
const listOrganizationsMock = vi.fn();

vi.mock("@workos-inc/node", () => ({
	WorkOS: class {
		userManagement = {
			listOrganizationMemberships:
				listOrganizationMembershipsMock,
			authenticateWithCode: authenticateWithCodeMock,
			loadSealedSession: loadSealedSessionMock,
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
