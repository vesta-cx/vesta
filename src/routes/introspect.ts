/** @format */

import { Hono } from "hono";
import type { AppEnv } from "../env";
import { routeRegistry, type RouteMetadata } from "../registry";

const route = new Hono<AppEnv>();

route.get("/introspect/routes", (c) => {
	const auth = c.get("auth");
	const origin =
		c.req.header("x-forwarded-proto") ?
			`${c.req.header("x-forwarded-proto")}://${c.req.header("x-forwarded-host")}`
		:	new URL(c.req.url).origin;
	const basePath = "/v0";

	const endpoints = routeRegistry.map((r) => ({
		...r,
		url: `${origin}${basePath}${r.path}`,
	}));

	return c.json({
		version: "v0",
		auth_status: auth?.type || "guest",
		endpoints,
	});
});

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/introspect/routes",
	description: "List all registered API routes",
	auth_required: true,
	scopes: ["admin"],
};
