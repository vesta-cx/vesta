/** @format */

import {
	createAuthRuntime,
	createVestaProvisioningAdapter,
} from "@vesta-cx/auth";
import { getDB } from "../db";

type EratoAuthBindings = {
	DB: D1Database;
	WORKOS_API_KEY: string;
	WORKOS_CLIENT_ID: string;
	WORKOS_COOKIE_PASSWORD: string;
	WORKOS_ORG_ID?: string;
};

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
		db: getDB(env.DB),
	});
