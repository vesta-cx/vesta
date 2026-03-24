/** @format */

import { describe, expect, it, vi } from "vitest";

const listOrganizationMembershipsMock = vi.fn();

vi.mock("@workos-inc/node", () => ({
	WorkOS: class {
		userManagement = {
			listOrganizationMemberships:
				listOrganizationMembershipsMock,
		};

		organizations = {};

		constructor(_apiKey: string) {}
	},
}));

import { createWorkOSTransport } from "../src/workos-transport.js";

describe("createWorkOSTransport", () => {
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
