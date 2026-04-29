/** @format */

import { Hono } from "hono";
import { requireAuth, requireScope } from "../auth/helpers";
import { ADMIN_SCOPE } from "../auth/types";
import { API_BASE_PATH, API_VERSION } from "../config/api-version";
import type { AppEnv } from "../env";
import { routeRegistry, type RouteMetadata } from "../registry";

const route = new Hono<AppEnv>();

const FORWARDED_HOST_PATTERN = /^[a-zA-Z0-9.-]+(?::\d+)?$/;

const isAllowedForwardedHost = (host: string, fallbackHost: string) =>
	host === fallbackHost ||
	host === "vesta.cx" ||
	host.endsWith(".vesta.cx") ||
	host.startsWith("localhost:") ||
	host.startsWith("127.0.0.1:");

const getTrustedOrigin = (request: Request) => {
	const fallbackUrl = new URL(request.url);
	const proto = request.headers.get("x-forwarded-proto");
	const host = request.headers.get("x-forwarded-host");
	if (
		(proto !== "http" && proto !== "https") ||
		!host ||
		!FORWARDED_HOST_PATTERN.test(host) ||
		!isAllowedForwardedHost(host, fallbackUrl.host)
	) {
		return fallbackUrl.origin;
	}

	return `${proto}://${host}`;
};

route.get("/introspect/routes", (c) => {
	const auth = requireAuth(c.get("auth"));
	requireScope(auth, ADMIN_SCOPE);
	const origin = getTrustedOrigin(c.req.raw);

	const endpoints = routeRegistry.map((r) => ({
		...r,
		url: `${origin}${API_BASE_PATH}${r.path}`,
	}));

	return c.json({
		version: API_VERSION,
		auth_status: auth.type,
		endpoints,
	});
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/introspect/routes",
	description: "List all registered API routes",
	auth_required: true,
	scopes: [ADMIN_SCOPE],
};
