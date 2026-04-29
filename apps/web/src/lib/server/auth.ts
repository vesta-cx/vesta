/** @format */

import {
	createAuthRuntimeFromEnv,
	createVestaProvisioningAdapter,
	type VestaProvisioningStore
} from '@vesta-cx/auth';
import { organizations, users } from '@vesta-cx/db';
import { getDb, type Database } from './db';

const runtimeCache = new WeakMap<
	App.Platform['env'],
	ReturnType<typeof createAuthRuntimeFromEnv>
>();

const createVestaProvisioningStore = (db: Database): VestaProvisioningStore => ({
	ensureOrganization: (organizationId) =>
		db.insert(organizations).values({ workosOrgId: organizationId }).onConflictDoNothing(),
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
					updatedAt: new Date()
				}
			}),
	transaction: (run) => db.transaction((tx) => run(createVestaProvisioningStore(tx)))
});

export const createWebAuthRuntime = (platform: App.Platform) => {
	const cached = runtimeCache.get(platform.env);
	if (cached) return cached;

	const runtime = createAuthRuntimeFromEnv(platform.env);
	runtimeCache.set(platform.env, runtime);
	return runtime;
};

export const createWebProvisioningAdapter = (platform: App.Platform) =>
	createVestaProvisioningAdapter({
		store: createVestaProvisioningStore(getDb(platform))
	});
