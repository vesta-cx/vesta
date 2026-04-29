/** @format */

import { spawn } from "node:child_process";
import process from "node:process";

const TABLE_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

const tableName = process.argv[2];
const env = process.argv[3] ?? "dev";

if (!tableName) {
	console.error("Usage: pnpm db:inspect:schema <table_name> [env]");
	process.exit(1);
}

if (!TABLE_NAME_PATTERN.test(tableName)) {
	console.error(
		"Invalid table name. Use letters, numbers, and underscores; the first character must be a letter or underscore.",
	);
	process.exit(1);
}

const query = `PRAGMA table_info(${tableName});`;

const child = spawn(
	"node",
	[
		"./scripts/wrangler-versioned.mjs",
		"d1",
		"execute",
		"DB",
		"--env",
		env,
		"--command",
		query,
	],
	{
		stdio: "inherit",
	},
);

child.on("error", (error) => {
	console.error("Failed to start Wrangler subprocess:", error);
	process.exit(1);
});

child.on("exit", (code) => {
	process.exit(code ?? 1);
});
