#!/usr/bin/env node
/**
 * Generates eut_<base64url> API key and appends to .euterpe-api-keys.
 * Usage: pnpm run gen-key
 *
 * @format
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const KEY_PREFIX = "eut_";
const KEYS_FILE = process.env["EUTERPE_KEYS_FILE"] ?? ".euterpe-api-keys";

const generateKey = (): string => {
	const bytes = crypto.randomBytes(24);
	const base64url = bytes
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
	return `${KEY_PREFIX}${base64url}`;
};

const main = (): void => {
	const key = generateKey();
	const absPath =
		path.isAbsolute(KEYS_FILE) ? KEYS_FILE : (
			path.join(process.cwd(), KEYS_FILE)
		);
	fs.appendFileSync(absPath, key + "\n", "utf8");
	console.log(key);
};

main();
