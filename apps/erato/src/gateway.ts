/** @format */

import { Hono } from "hono";

type GatewayEnv = {
	Bindings: { ASSETS: Fetcher };
};

const app = new Hono<GatewayEnv>();

app.get("/", (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
