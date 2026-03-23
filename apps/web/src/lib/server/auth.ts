/** @format */

import {
	createAuthRuntimeFromEnv,
	createVestaProvisioningAdapter,
	type WorkOSAuthEnv
} from '@vesta-cx/auth';
import { getDb } from './db';

const runtimeCache = new Map<string, ReturnType<typeof createAuthRuntimeFromEnv>>();

const getRuntimeCacheKey = (env: WorkOSAuthEnv) =>
	JSON.stringify([
		env.PRIVATE_WORKOS_CLIENT_ID,
		env.PRIVATE_WORKOS_API_KEY,
		env.PRIVATE_WORKOS_COOKIE_PASSWORD,
		env.PRIVATE_WORKOS_ORG_ID ?? null
	]);

export const createWebAuthRuntime = (platform: App.Platform) => {
	const cacheKey = getRuntimeCacheKey(platform.env);
	const cached = runtimeCache.get(cacheKey);
	if (cached) return cached;

	const runtime = createAuthRuntimeFromEnv(platform.env);
	runtimeCache.set(cacheKey, runtime);

	return runtime;
};

export const createWebProvisioningAdapter = (platform: App.Platform) =>
	createVestaProvisioningAdapter({
		db: getDb(platform)
	});
