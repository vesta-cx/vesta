/** @format */

import { createAuthRuntimeFromEnv } from '@vesta-cx/auth';

const runtimeCache = new WeakMap<
	App.Platform['env'],
	ReturnType<typeof createAuthRuntimeFromEnv>
>();

export const createSonaAuthRuntime = (platform: App.Platform) => {
	const cached = runtimeCache.get(platform.env);
	if (cached) return cached;

	const runtime = createAuthRuntimeFromEnv(platform.env);
	runtimeCache.set(platform.env, runtime);
	return runtime;
};
