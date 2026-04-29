/** @format */

import { TerminalAuthError } from "./errors.js";
import type {
	AuthOrganizationMembership,
	AuthProvisioningAdapter,
	AuthProvisioningRequest,
} from "./types.js";

export interface VestaProvisioningUserInput {
	workosUserId: string;
	email: string;
	displayName: string | null;
	avatarUrl: string | null;
	organizationId: string;
}

export interface VestaProvisioningStore {
	ensureOrganization(organizationId: string): PromiseLike<unknown>;
	upsertUser(input: VestaProvisioningUserInput): PromiseLike<unknown>;
	transaction?<T>(
		run: (store: VestaProvisioningStore) => Promise<T>,
	): Promise<T>;
}

const buildDisplayName = (input: {
	firstName: string | null;
	lastName: string | null;
}): string | null => {
	const parts = [input.firstName, input.lastName]
		.map((value) => value?.trim())
		.filter((value): value is string => Boolean(value));

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

const provisionWithStore = async (
	store: VestaProvisioningStore,
	request: AuthProvisioningRequest,
) => {
	const activeOrganizationId = resolveActiveOrganizationId(request);
	const organizationIds = collectOrganizationIds({
		memberships: request.session.memberships,
		activeOrganizationId,
	});

	const writeProvisioningState = async (
		target: VestaProvisioningStore,
	) => {
		for (const organizationId of organizationIds) {
			await target.ensureOrganization(organizationId);
		}

		await target.upsertUser({
			workosUserId: request.session.userId,
			email: request.session.email,
			displayName: buildDisplayName({
				firstName: request.session.firstName,
				lastName: request.session.lastName,
			}),
			avatarUrl: request.session.profilePictureUrl,
			organizationId: activeOrganizationId,
		});
	};

	if (store.transaction) {
		await store.transaction(writeProvisioningState);
	} else {
		await writeProvisioningState(store);
	}

	return {
		activeOrganizationId,
		organizationIds,
	};
};

/**
 * Creates the first-party Vesta provisioning adapter from app-owned storage
 * operations. The auth package owns session-to-provisioning mapping; apps own
 * their concrete database schema and transaction implementation.
 */
export const createVestaProvisioningAdapter = (input: {
	store: VestaProvisioningStore;
}): AuthProvisioningAdapter => ({
	provision: (request) => provisionWithStore(input.store, request),
});
