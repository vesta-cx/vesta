/** @format */

import {
	createAuthRuntime,
	createVestaProvisioningAdapter,
	type VestaProvisioningStore,
} from "@vesta-cx/auth";
import { organizations, users } from "@vesta-cx/db";
import { getDB, type Database } from "../db";
import type { AppEnv } from "../env";

type EratoAuthBindings = Pick<
	AppEnv["Bindings"],
	| "DB"
	| "WORKOS_API_KEY"
	| "WORKOS_CLIENT_ID"
	| "WORKOS_COOKIE_PASSWORD"
	| "WORKOS_ORG_ID"
>;

const createVestaProvisioningStore = (
	db: Database,
): VestaProvisioningStore => ({
	ensureOrganization: (organizationId) =>
		db
			.insert(organizations)
			.values({ workosOrgId: organizationId })
			.onConflictDoNothing(),
	upsertUser: (user) =>
		db
			.insert(users)
			.values(user)
			.onConflictDoUpdate({
				target: users.workosUserId,
				set: {
					email: user.email,
					displayName: user.displayName,
					avatarUrl: user.avatarUrl,
					organizationId: user.organizationId,
					updatedAt: new Date(),
				},
			}),
	transaction: (run) =>
		db.transaction((tx) => run(createVestaProvisioningStore(tx))),
});

export const createEratoAuthRuntime = (env: EratoAuthBindings) =>
	createAuthRuntime({
		apiKey: env.WORKOS_API_KEY,
		clientId: env.WORKOS_CLIENT_ID,
		cookiePassword: env.WORKOS_COOKIE_PASSWORD,
		...(env.WORKOS_ORG_ID ?
			{ defaultOrganizationId: env.WORKOS_ORG_ID }
		:	{}),
	});

export const createEratoProvisioningAdapter = (env: EratoAuthBindings) =>
	createVestaProvisioningAdapter({
		store: createVestaProvisioningStore(getDB(env.DB)),
	});
