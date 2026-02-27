/** @format */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import semver from "semver";

// Deep merge utility - merges source into target, with source values taking precedence
const deepMerge = (target, source) => {
	for (const key in source) {
		if (
			source[key] &&
			typeof source[key] === "object" &&
			!Array.isArray(source[key])
		) {
			target[key] = deepMerge(target[key] || {}, source[key]);
		} else {
			target[key] = source[key];
		}
	}
	return target;
};

const appRoot = process.cwd();
const packageJsonPath = path.join(appRoot, "package.json");
const wranglerPath = path.join(appRoot, "wrangler.jsonc");
const appVersionConfigPath = path.join(
	appRoot,
	"src",
	"config",
	"api-version.ts",
);

const packageJsonRaw = await readFile(packageJsonPath, "utf8");
const packageJson = JSON.parse(packageJsonRaw);
const version = packageJson.version;

if (!semver.valid(version)) {
	throw new Error(`Invalid package.json version: ${version}`);
}

const apiVersion = `v${semver.major(version)}`;
const apiEnv = apiVersion;
const workerName = `vesta_erato_${apiVersion}`;

// Read and parse wrangler.jsonc as JSON (strip comments and trailing commas first)
// JSONC allows comments and trailing commas, but JSON.parse doesn't
const wranglerRaw = await readFile(wranglerPath, "utf8");
const wranglerNoComments = wranglerRaw
	.replace(/\/\*[\s\S]*?\*\//g, "") // Remove block comments
	.replace(/\/\/.*$/gm, "") // Remove line comments (multiline flag)
	.replace(/,(\s*[}\]])/g, "$1"); // Remove trailing commas
const wrangler = JSON.parse(wranglerNoComments);

// Ensure env object exists
if (!wrangler.env) {
	wrangler.env = {};
}

// Start with prod defaults (deep copy to avoid mutation)
const prodDefaults = structuredClone(wrangler.env.prod || {});

// Build routes: start from prod defaults, then append the versioned path-pattern route.
// deepMerge replaces arrays, so routes must be assembled separately.
const versionedRoute = {
	pattern: `erato.vesta.cx/${apiVersion}/*`,
	zone_name: "vesta.cx",
};
const baseRoutes = (prodDefaults.routes || []).filter(
	(r) => r.pattern !== versionedRoute.pattern,
);
const envRoutes = [...baseRoutes, versionedRoute];

// Merge: prodDefaults < existingEnv < newApiEnvBlock
// This preserves any manual overrides in existingEnv while inheriting prod bindings
const existingEnv = wrangler.env[apiEnv] || {};
const mergedEnv = deepMerge(deepMerge(prodDefaults, existingEnv), {
	name: workerName,
	routes: envRoutes,
	vars: {
		API_VERSION: apiVersion,
	},
});

wrangler.env[apiEnv] = mergedEnv;

// Write back with 2-space indentation
await writeFile(wranglerPath, JSON.stringify(wrangler, null, 2) + "\n", "utf8");

const appVersionConfig = `export const API_VERSION = "${apiVersion}";
export const API_BASE_PATH = \`/\${API_VERSION}\`;
`;
await writeFile(appVersionConfigPath, appVersionConfig, "utf8");

console.log(`Synced API version: ${apiVersion} (${version}), env: ${apiEnv}`);
