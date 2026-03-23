/** @format */

import { Hono } from "hono";
import type { AppEnv } from "./env";
import { resolveShortLink } from "./lib/short-link-service";

export const app = new Hono<AppEnv>();

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/:slug", async (c) => {
	const result = await resolveShortLink({
		slug: c.req.param("slug"),
		kv: c.env.SHORT_LINKS,
		requestUrl: c.req.url,
		canonicalOrigin: c.env.CANONICAL_ORIGIN,
	});

	if (result.type === "redirect") {
		console.info(
			JSON.stringify({
				event: "shortener.redirect",
				slug: result.slug,
				location: result.location,
				targetType: result.record.targetType,
			}),
		);
		return c.redirect(result.location, 302);
	}

	console.warn(
		JSON.stringify({
			event: "shortener.lookup_failed",
			slug: result.slug,
			reason: result.reason,
			details: result.details ?? null,
		}),
	);

	return c.text("Short URL not found", 404);
});

export default app;
