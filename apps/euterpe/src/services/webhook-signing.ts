/** @format */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db, requesterSigningSecrets } from "../db/index.js";

const DEFAULT_SKEW_MS = 5 * 60 * 1000;
const nonceCache = new Map<string, number>();

const getSecretFromDb = async (requesterId: string): Promise<string | null> => {
	try {
		const [row] = await db
			.select({ secret: requesterSigningSecrets.secret })
			.from(requesterSigningSecrets)
			.where(
				and(
					eq(
						requesterSigningSecrets.requesterId,
						requesterId,
					),
					eq(
						requesterSigningSecrets.isActive,
						true,
					),
				),
			)
			.orderBy(desc(requesterSigningSecrets.updatedAt))
			.limit(1);
		return row?.secret ?? null;
	} catch {
		return null;
	}
};

const getSecret = async (requesterId: string): Promise<string | null> => {
	const dbSecret = await getSecretFromDb(requesterId);
	if (dbSecret) return dbSecret;
	return process.env["EUTERPE_WEBHOOK_SECRET"] ?? null;
};

const signRaw = (
	secret: string,
	timestamp: string,
	nonce: string,
	body: string,
): string =>
	createHmac("sha256", secret)
		.update(`${timestamp}.${nonce}.${body}`, "utf8")
		.digest("hex");

export const buildSignedWebhookHeaders = async (params: {
	requesterId: string;
	rawBody: string;
	eventId: string;
}): Promise<Record<string, string>> => {
	const secret = await getSecret(params.requesterId);
	if (!secret)
		throw new Error(
			`Missing webhook secret for requester: ${params.requesterId}`,
		);
	const timestamp = Date.now().toString();
	const nonce = randomUUID();
	const signature = signRaw(secret, timestamp, nonce, params.rawBody);
	return {
		"x-euterpe-signature": signature,
		"x-euterpe-timestamp": timestamp,
		"x-euterpe-nonce": nonce,
		"x-euterpe-event-id": params.eventId,
		"content-type": "application/json",
	};
};

export const verifyInboundSignature = async (params: {
	requesterId: string;
	rawBody: string;
	signature: string;
	timestamp: string;
	nonce: string;
}): Promise<boolean> => {
	const secret = await getSecret(params.requesterId);
	if (!secret) return false;
	const ts = Number(params.timestamp);
	if (!Number.isFinite(ts)) return false;
	if (Math.abs(Date.now() - ts) > DEFAULT_SKEW_MS) return false;

	const cacheKey = `${params.requesterId}:${params.nonce}`;
	const seenAt = nonceCache.get(cacheKey);
	if (seenAt && Date.now() - seenAt < DEFAULT_SKEW_MS) return false;
	nonceCache.set(cacheKey, Date.now());

	const expected = signRaw(
		secret,
		params.timestamp,
		params.nonce,
		params.rawBody,
	);
	const actual = params.signature;
	const expectedBuf = Buffer.from(expected, "hex");
	const actualBuf = Buffer.from(actual, "hex");
	if (expectedBuf.length !== actualBuf.length) return false;
	return timingSafeEqual(expectedBuf, actualBuf);
};
