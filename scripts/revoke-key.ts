#!/usr/bin/env node
/**
 * Revokes an API key: remove from .euterpe-api-keys or add to .euterpe-revoked-keys.
 * Usage: pnpm run revoke-key <key>
 *
 * @format
 */

import * as fs from "node:fs";
import * as path from "node:path";

const KEYS_FILE = process.env["EUTERPE_KEYS_FILE"] ?? ".euterpe-api-keys";
const REVOKED_FILE =
	process.env["EUTERPE_REVOKED_FILE"] ?? ".euterpe-revoked-keys";

const main = (): void => {
	const key = process.argv[2]?.trim();
	if (!key) {
		console.error("Usage: pnpm run revoke-key <key>");
		process.exit(1);
	}

	const keysPath =
		path.isAbsolute(KEYS_FILE) ? KEYS_FILE : (
			path.join(process.cwd(), KEYS_FILE)
		);
	const revokedPath =
		path.isAbsolute(REVOKED_FILE) ? REVOKED_FILE : (
			path.join(process.cwd(), REVOKED_FILE)
		);

	let keysContent = "";
	try {
		keysContent = fs.readFileSync(keysPath, "utf8");
	} catch {
		// file doesn't exist
	}

	const lines = keysContent.split("\n").filter((line) => line.trim());
	const foundInFile = lines.includes(key);
	const newLines = lines.filter((l) => l !== key);

	if (foundInFile) {
		fs.writeFileSync(
			keysPath,
			newLines.join("\n") + (newLines.length > 0 ? "\n" : ""),
			"utf8",
		);
		console.log("Key removed from", KEYS_FILE);
		return;
	}

	// Key not in file (env-only) — add to revoked list
	fs.appendFileSync(revokedPath, key + "\n", "utf8");
	console.log(
		"Key added to",
		REVOKED_FILE,
		"(was not in keys file; likely env-only)",
	);
};

main();
