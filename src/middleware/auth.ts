/** @format */

import { createMiddleware } from "hono/factory";
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash, timingSafeEqual } from "node:crypto";

const KEY_PREFIX = "eut_";
const KEYS_FILE = process.env["EUTERPE_KEYS_FILE"] ?? ".euterpe-api-keys";
const REVOKED_FILE =
	process.env["EUTERPE_REVOKED_FILE"] ?? ".euterpe-revoked-keys";

const hashKey = (key: string): Buffer =>
	createHash("sha256").update(key, "utf8").digest();

const loadKeysFromFile = (filePath: string): string[] => {
	try {
		const abs =
			path.isAbsolute(filePath) ? filePath : (
				path.join(process.cwd(), filePath)
			);
		const content = fs.readFileSync(abs, "utf8");
		return content
			.split("\n")
			.map((line) => line.trim())
			.filter(
				(line) =>
					line.length > 0 &&
					!line.startsWith("#"),
			);
	} catch {
		return [];
	}
};

const loadRevokedKeys = (): Set<string> => {
	const keys = loadKeysFromFile(REVOKED_FILE);
	return new Set(keys);
};

const loadValidKeys = (): string[] => {
	const fromEnv: string[] = [];
	const single = process.env["EUTERPE_API_KEY"];
	if (single) fromEnv.push(single);
	const multi = process.env["EUTERPE_API_KEYS"];
	if (multi)
		fromEnv.push(
			...multi
				.split(",")
				.map((k) => k.trim())
				.filter(Boolean),
		);
	const fromFile = loadKeysFromFile(KEYS_FILE);
	return [...new Set([...fromEnv, ...fromFile])];
};

const validateKey = (provided: string): boolean => {
	if (!provided.startsWith(KEY_PREFIX)) return false;
	const revoked = loadRevokedKeys();
	if (revoked.has(provided)) return false;
	const validKeys = loadValidKeys();
	if (validKeys.length === 0) return false;
	const providedHash = hashKey(provided);
	for (const valid of validKeys) {
		const validHash = hashKey(valid);
		if (
			providedHash.length === validHash.length &&
			timingSafeEqual(providedHash, validHash)
		) {
			return true;
		}
	}
	return false;
};

export const apiKeyAuth = createMiddleware(async (c, next) => {
	const raw =
		c.req
			.header("Authorization")
			?.replace(/^Bearer\s+/i, "")
			.trim() ?? c.req.header("X-API-Key")?.trim();
	if (!raw) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	if (!validateKey(raw)) {
		return c.json({ error: "Unauthorized" }, 401);
	}
	await next();
});
