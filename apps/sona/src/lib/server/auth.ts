/** @format */

import { createAuthRuntimeFromEnv, type WorkOSAuthEnv } from '@vesta-cx/auth';

const runtimeCache = new Map<string, ReturnType<typeof createAuthRuntimeFromEnv>>();

const getRuntimeCacheKey = (env: WorkOSAuthEnv) =>
	JSON.stringify([
		env.PRIVATE_WORKOS_CLIENT_ID,
		env.PRIVATE_WORKOS_API_KEY,
		env.PRIVATE_WORKOS_COOKIE_PASSWORD,
		env.PRIVATE_WORKOS_ORG_ID ?? null
	]);

export const createSonaAuthRuntime = (platform: App.Platform) => {
	const cacheKey = getRuntimeCacheKey(platform.env);
	const cached = runtimeCache.get(cacheKey);
	if (cached) return cached;

	const runtime = createAuthRuntimeFromEnv(platform.env);
	runtimeCache.set(cacheKey, runtime);

	return runtime;
};
