/** @format */

import { Hono } from "hono";
import type { AppEnv } from "../env";
import type { RouteMetadata } from "../registry";

const route = new Hono<AppEnv>();

route.get("/health", (c) => c.json({ status: "ok", version: "v0" }));

export default {
	route,
	method: "GET" as RouteMetadata["method"],
	path: "/health",
	description: "Health check",
	auth_required: false,
};
