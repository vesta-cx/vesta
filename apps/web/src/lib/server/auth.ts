/** @format */

import { createAuthRuntimeFromEnv, createVestaProvisioningAdapter } from '@vesta-cx/auth';
import { getDb } from './db';

const runtimeCache = new WeakMap<
	App.Platform['env'],
	ReturnType<typeof createAuthRuntimeFromEnv>
>();

export const createWebAuthRuntime = (platform: App.Platform) => {
	const cached = runtimeCache.get(platform.env);
	if (cached) return cached;

	const runtime = createAuthRuntimeFromEnv(platform.env);
	runtimeCache.set(platform.env, runtime);
	return runtime;
};

export const createWebProvisioningAdapter = (platform: App.Platform) =>
	createVestaProvisioningAdapter({
		db: getDb(platform)
	});
