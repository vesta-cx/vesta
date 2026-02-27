/** @format */

import type { AuthContext } from "./auth/types";

export type AppEnv = {
	Bindings: CloudflareBindings & {
		DB: D1Database;
		KV: KVNamespace;
		WORKOS_API_KEY: string;
		WORKOS_CLIENT_ID: string;
	};
	Variables: { auth: AuthContext };
};
