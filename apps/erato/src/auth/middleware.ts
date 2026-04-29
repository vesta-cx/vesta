/** @format */

import { DEFAULT_AUTH_COOKIE_NAME } from "@vesta-cx/auth";
import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../env";
import { parseApiKeyMeta } from "./types";
import { hashApiKey } from "./helpers";
import { API_KEY_KV_PREFIX } from "./keys";
import {
	createEratoAuthRuntime,
	createEratoProvisioningAdapter,
} from "./runtime";

const authenticateSession = async (c: Context<AppEnv>) => {
	const sealedSession = getCookie(c, DEFAULT_AUTH_COOKIE_NAME);
	if (!sealedSession) return false;

	let result;
	try {
		result = await createEratoAuthRuntime(
			c.env,
		).authenticateSealedSession({
			sealedSession,
			resolveMemberships: true,
			provisioningAdapter: createEratoProvisioningAdapter(
				c.env,
			),
		});
	} catch (error) {
		console.warn("Erato session authentication failed", error);
		return false;
	}

	if (!result.authenticated) return false;

	c.set("auth", {
		type: "session",
		subjectType: "user",
		subjectId: result.session.userId,
		scopes: result.session.permissions,
		session: result.session,
	});
	return true;
};

export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
	const header = c.req.header("Authorization");
	const rawKey = header?.startsWith("Bearer ") ? header.slice(7) : "";

	if (!rawKey) {
		if (!(await authenticateSession(c))) {
			c.set("auth", { type: "guest" });
		}
		return next();
	}

	const hash = await hashApiKey(rawKey);
	const kvValue = await c.env.KV.get(`${API_KEY_KV_PREFIX}${hash}`);

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
