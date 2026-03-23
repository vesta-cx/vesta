/** @format */

import { createAuthRuntimeFromEnv } from '@vesta-cx/auth';

export const createSonaAuthRuntime = (platform: App.Platform) =>
	createAuthRuntimeFromEnv(platform.env);
