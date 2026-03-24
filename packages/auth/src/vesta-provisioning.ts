/** @format */

import { organizations, users } from "@vesta-cx/db";
import { TerminalAuthError } from "./errors.js";
import type {
	AuthOrganizationMembership,
	AuthProvisioningAdapter,
	AuthProvisioningRequest,
} from "./types.js";

type UserUpsertQuery = PromiseLike<unknown>;
type OrganizationUpsertQuery = PromiseLike<unknown>;

interface VestaProvisioningDb {
	insert(table: typeof users): {
		values(value: typeof users.$inferInsert): {
			onConflictDoUpdate(input: {
				target: typeof users.workosUserId;
				set: Partial<typeof users.$inferInsert>;
			}): UserUpsertQuery;
		};
	};
	insert(table: typeof organizations): {
		values(value: typeof organizations.$inferInsert): {
			onConflictDoNothing(): OrganizationUpsertQuery;
		};
	};
}

const buildDisplayName = (input: {
	firstName: string | null;
	lastName: string | null;
}): string | null => {
	const parts = [input.firstName, input.lastName].filter(
		(value): value is string => Boolean(value && value.trim()),
	);

	return parts.length > 0 ? parts.join(" ") : null;
};

const collectOrganizationIds = (input: {
	memberships: AuthOrganizationMembership[];
	activeOrganizationId: string;
}): string[] => {
	const ids = new Set<string>([input.activeOrganizationId]);

	for (const membership of input.memberships) {
		ids.add(membership.organizationId);
	}

	return [...ids];
};

const resolveActiveOrganizationId = (
	input: AuthProvisioningRequest,
): string => {
	const membershipOrganizationId = input.session.memberships.find(
		(membership) => membership.status === "active",
	)?.organizationId;

	const organizationId =
		input.session.organizationId ??
		membershipOrganizationId ??
		input.fallbackOrganizationId;

	if (!organizationId) {
		throw new TerminalAuthError(
			"Provisioning requires an active organization context",
			"provision",
			{ status: 401 },
		);
	}

	return organizationId;
};

export const createVestaProvisioningAdapter = (input: {
	db: VestaProvisioningDb;
}): AuthProvisioningAdapter => ({
	provision: async (request) => {
		const activeOrganizationId =
			resolveActiveOrganizationId(request);
		const organizationIds = collectOrganizationIds({
			memberships: request.session.memberships,
			activeOrganizationId,
		});

		for (const organizationId of organizationIds) {
			await input.db
				.insert(organizations)
				.values({
					workosOrgId: organizationId,
				})
				.onConflictDoNothing();
		}

		await input.db
			.insert(users)
			.values({
				workosUserId: request.session.userId,
				email: request.session.email,
				displayName: buildDisplayName({
					firstName: request.session.firstName,
					lastName: request.session.lastName,
				}),
				avatarUrl: request.session.profilePictureUrl,
				organizationId: activeOrganizationId,
			})
			.onConflictDoUpdate({
				target: users.workosUserId,
				set: {
					email: request.session.email,
					displayName: buildDisplayName({
						firstName: request.session
							.firstName,
						lastName: request.session
							.lastName,
					}),
					avatarUrl: request.session
						.profilePictureUrl,
					organizationId: activeOrganizationId,
					updatedAt: new Date(),
				},
			});

		return {
			activeOrganizationId,
			organizationIds,
		};
	},
});
