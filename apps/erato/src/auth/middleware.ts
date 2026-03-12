/** @format */

import { createMiddleware } from "hono/factory";
import type { AuthContext } from "./types";
import { parseApiKeyMeta } from "./types";
import { hashApiKey } from "./helpers";

type AuthEnv = {
	Bindings: { KV: KVNamespace };
	Variables: { auth: AuthContext };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
	const header = c.req.header("Authorization");

	if (!header || !header.startsWith("Bearer ")) {
		c.set("auth", { type: "guest" });
		return next();
	}

	const rawKey = header.slice(7);
	if (!rawKey) {
		c.set("auth", { type: "guest" });
		return next();
	}

	const hash = await hashApiKey(rawKey);
	const kvValue = await c.env.KV.get(`ak:${hash}`);

	if (!kvValue) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const meta = parseApiKeyMeta(kvValue);
	if (!meta) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	if (meta.expiresAt && new Date(meta.expiresAt).getTime() < Date.now()) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("auth", {
		type: "apikey",
		subjectType: meta.subjectType,
		subjectId: meta.subjectId,
		scopes: meta.scopes,
	});

	return next();
});
