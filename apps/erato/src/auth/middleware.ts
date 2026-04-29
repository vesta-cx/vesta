/** @format */

import { DEFAULT_AUTH_COOKIE_NAME } from "@vesta-cx/auth";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { AuthContext } from "./types";
import { parseApiKeyMeta } from "./types";
import { hashApiKey } from "./helpers";
import {
	createEratoAuthRuntime,
	createEratoProvisioningAdapter,
} from "./runtime";

type AuthEnv = {
	Bindings: {
		DB: D1Database;
		KV: KVNamespace;
		WORKOS_API_KEY: string;
		WORKOS_CLIENT_ID: string;
		WORKOS_COOKIE_PASSWORD: string;
		WORKOS_ORG_ID?: string;
	};
	Variables: { auth: AuthContext };
};

const readCookie = (header: string | undefined, name: string) =>
	header
		?.split(";")
		.map((cookie) => cookie.trim())
		.find((cookie) => cookie.startsWith(`${name}=`))
		?.slice(name.length + 1);

const authenticateSession = async (c: Context<AuthEnv>) => {
	const sealedSession = readCookie(
		c.req.header("Cookie"),
		DEFAULT_AUTH_COOKIE_NAME,
	);
	if (!sealedSession) return false;

	const result = await createEratoAuthRuntime(
		c.env,
	).authenticateSealedSession({
		sealedSession,
		resolveMemberships: true,
		provisioningAdapter: createEratoProvisioningAdapter(c.env),
	});

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

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
	const header = c.req.header("Authorization");

	if (!header || !header.startsWith("Bearer ")) {
		if (!(await authenticateSession(c))) {
			c.set("auth", { type: "guest" });
		}
		return next();
	}

	const rawKey = header.slice(7);
	if (!rawKey) {
		if (!(await authenticateSession(c))) {
			c.set("auth", { type: "guest" });
		}
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
