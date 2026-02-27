/** @format */

import type { AuthContext } from "./auth/types";

export type AppEnv = {
	Bindings: CloudflareBindings & { DB: D1Database; KV: KVNamespace };
	Variables: { auth: AuthContext };
};
