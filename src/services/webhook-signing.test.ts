/** @format */

import { describe, expect, it } from "vitest";
import {
	buildSignedWebhookHeaders,
	verifyInboundSignature,
} from "./webhook-signing.js";

describe("webhook signing", () => {
	it("generates verifiable signatures", async () => {
		process.env["EUTERPE_WEBHOOK_SECRET"] = "secret";
		const body = JSON.stringify({ hello: "world" });
		const headers = await buildSignedWebhookHeaders({
			requesterId: "tester",
			rawBody: body,
			eventId: "evt-1",
		});
		const verified = await verifyInboundSignature({
			requesterId: "tester",
			rawBody: body,
			signature: headers["x-euterpe-signature"]!,
			timestamp: headers["x-euterpe-timestamp"]!,
			nonce: headers["x-euterpe-nonce"]!,
		});
		expect(verified).toBe(true);
	});
});
