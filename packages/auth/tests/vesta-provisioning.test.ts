/** @format */

import { describe, expect, it, vi } from "vitest";
import { createVestaProvisioningAdapter } from "../src/vesta-provisioning.js";
import type { AuthSession } from "../src/types.js";

const session = (overrides: Partial<AuthSession> = {}): AuthSession => ({
	sessionId: "sess_123",
	userId: "user_123",
	email: "mia@example.com",
	firstName: " Mia ",
	lastName: " Example ",
	emailVerified: true,
	profilePictureUrl: null,
	organizationId: "org_123",
	roleSlug: null,
	permissions: [],
	entitlements: [],
	memberships: [],
	...overrides,
});

describe("createVestaProvisioningAdapter", () => {
	it("trims display names before upserting users", async () => {
		const upsertUser = vi.fn(async () => undefined);
		const adapter = createVestaProvisioningAdapter({
			store: {
				ensureOrganization: async () => undefined,
				upsertUser,
			},
		});

		await adapter.provision({ session: session() });

		expect(upsertUser).toHaveBeenCalledWith(
			expect.objectContaining({
				displayName: "Mia Example",
			}),
		);
	});

	it("runs provisioning writes through the store transaction when available", async () => {
		const calls: string[] = [];
		const transactionalStore = {
			ensureOrganization: vi.fn(
				async (organizationId: string) => {
					calls.push(
						`organization:${organizationId}`,
					);
				},
			),
			upsertUser: vi.fn(async () => {
				calls.push("user");
			}),
		};
		const adapter = createVestaProvisioningAdapter({
			store: {
				ensureOrganization: async () => undefined,
				upsertUser: async () => undefined,
				transaction: async (run) => {
					calls.push("transaction:start");
					await run(transactionalStore);
					calls.push("transaction:end");
				},
			},
		});

		await adapter.provision({ session: session() });

		expect(calls).toEqual([
			"transaction:start",
			"organization:org_123",
			"user",
			"transaction:end",
		]);
	});
});
