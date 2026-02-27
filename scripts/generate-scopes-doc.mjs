/** @format */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const appRoot = process.cwd();
const routesRoot = path.join(appRoot, "src", "routes");
const apiVersionPath = path.join(appRoot, "src", "config", "api-version.ts");
const docsOutputPath = path.join(
	appRoot,
	"..",
	"docs",
	"content",
	"apps",
	"erato",
);

const apiVersionRaw = await readFile(apiVersionPath, "utf8");
const versionMatch = apiVersionRaw.match(/API_VERSION = "([^"]+)"/);
if (!versionMatch) {
	throw new Error(
		"Could not read API_VERSION from src/config/api-version.ts",
	);
}
const apiVersion = versionMatch[1];

const walk = async (dir) => {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) return walk(fullPath);
			return [fullPath];
		}),
	);
	return files.flat();
};

const parseRouteMetadata = (fileContent) => {
	const blockMatch = fileContent.match(
		/export default\s*\{([\s\S]*?)\};/,
	);
	if (!blockMatch) return null;

	const block = blockMatch[1];
	const methodMatch = block.match(/method:\s*"([^"]+)"/);
	const pathMatch = block.match(/path:\s*"([^"]+)"/);
	const authMatch = block.match(/auth_required:\s*(true|false)/);
	const scopesMatch = block.match(/scopes:\s*\[([^\]]*)\]/);

	if (!methodMatch || !pathMatch || !authMatch) return null;

	const scopes =
		scopesMatch ?
			Array.from(scopesMatch[1].matchAll(/"([^"]+)"/g)).map(
				(m) => m[1],
			)
		:	[];

	return {
		method: methodMatch[1],
		path: pathMatch[1],
		authRequired: authMatch[1] === "true",
		scopes,
	};
};

const allFiles = await walk(routesRoot);
const routeFiles = allFiles.filter((filePath) => {
	const rel = path.relative(routesRoot, filePath);
	return (
		filePath.endsWith(".ts") &&
		!rel.endsWith("index.ts") &&
		!rel.endsWith(".test.ts")
	);
});

const routes = [];
for (const filePath of routeFiles) {
	const content = await readFile(filePath, "utf8");
	const metadata = parseRouteMetadata(content);
	if (!metadata) continue;
	routes.push(metadata);
}

routes.sort(
	(a, b) =>
		a.path.localeCompare(b.path) ||
		a.method.localeCompare(b.method),
);

const now = new Date().toISOString();
const rows = routes
	.map((route) => {
		const scopedPath = `/${apiVersion}${route.path}`;
		const scopesText =
			route.scopes.length ? route.scopes.join(", ") : "-";
		return `| ${route.method} | \`${scopedPath}\` | ${route.authRequired ? "true" : "false"} | ${scopesText} |`;
	})
	.join("\n");

const markdown = `---
title: Erato scopes (${apiVersion})
---

# Erato Route Scopes (${apiVersion})

Generated from \`apps/erato/src/routes\` metadata on ${now}.

| Method | Path | Auth Required | Scopes |
| --- | --- | --- | --- |
${rows}
`;

const outputDir = path.join(docsOutputPath, apiVersion);
const outputFile = path.join(outputDir, "scopes.md");
await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, markdown, "utf8");

console.log(`Wrote ${routes.length} routes to ${outputFile}`);
