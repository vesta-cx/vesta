/** @format */

import { createAuthRuntimeFromEnv, createVestaProvisioningAdapter } from '@vesta-cx/auth';
import { getDb } from './db';

export const createWebAuthRuntime = (platform: App.Platform) =>
	createAuthRuntimeFromEnv(platform.env);

export const createWebProvisioningAdapter = (platform: App.Platform) =>
	createVestaProvisioningAdapter({
		db: getDb(platform)
	});
