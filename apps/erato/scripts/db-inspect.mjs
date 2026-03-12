/** @format */

import { spawn } from "node:child_process";
import process from "node:process";

// Get table name from CLI argument
const tableName = process.argv[2];

if (!tableName) {
	console.error("Usage: pnpm db:inspect:schema <table_name>");
	process.exit(1);
}

// PRAGMA table_info shows column definitions for a table
const query = `PRAGMA table_info(${tableName});`;

// Spawn wrangler-versioned wrapper to execute the query
const child = spawn(
	"node",
	[
		"./scripts/wrangler-versioned.mjs",
		"d1",
		"execute",
		"DB",
		"--env",
		"dev",
		"--command",
		query,
	],
	{
		stdio: "inherit",
	},
);

child.on("exit", (code) => {
	process.exit(code ?? 1);
});
