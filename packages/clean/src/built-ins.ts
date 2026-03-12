/** @format */

export type CleanMode = "delete" | "contentsOnly";
export type CleanStrategy = "sequential" | "parallel";
export type CleanReportMode = "none" | "summary" | "json";

export interface CleanEntryConfig {
	include: string[];
	exclude?: string[];
	tags?: string[];
	enabled?: boolean;
	mode?: CleanMode;
	dryRun?: boolean;
	confirm?: boolean;
	interactive?: boolean;
	verbose?: boolean;
	ignoreErrors?: boolean;
	protect?: string[];
	strategy?: CleanStrategy;
	force?: boolean;
	cwd?: string;
	report?: CleanReportMode;
}

export type CleanCommandsMap = Record<string, CleanEntryConfig>;

/**
 * Built-in command templates for popular tools/frameworks.
 * These are surfaced in init/docs and are not injected implicitly at runtime.
 */
export const BUILT_IN_COMMANDS: CleanCommandsMap = {
	"install": {
		include: ["node_modules"],
		tags: ["deps"],
	},
	"turbo": {
		include: [".turbo"],
		tags: ["cache", "build"],
	},
	"wrangler": {
		include: [".wrangler"],
		tags: ["cache", "cloudflare"],
	},
	"svelte": {
		include: [".svelte-kit"],
		tags: ["cache", "svelte"],
	},
	"vite": {
		include: ["node_modules/.vite"],
		tags: ["cache", "vite"],
	},
	"storybook": {
		include: [".storybook-cache", "storybook-static"],
		tags: ["cache", "storybook"],
	},
	"next": {
		include: [".next"],
		tags: ["cache", "next"],
	},
	"nuxt": {
		include: [".nuxt", ".output"],
		tags: ["cache", "nuxt", "framework"],
	},
	"astro": {
		include: [".astro"],
		tags: ["cache", "astro", "framework"],
	},
	"remix": {
		include: [".cache/remix"],
		tags: ["cache", "remix", "framework"],
	},
	"angular": {
		include: [".angular"],
		tags: ["cache", "angular", "framework"],
	},
	"webpack": {
		include: ["node_modules/.cache/webpack", ".cache/webpack"],
		tags: ["cache", "webpack", "build"],
	},
	"rollup": {
		include: [".rollup.cache", "node_modules/.cache/rollup"],
		tags: ["cache", "rollup", "build"],
	},
	"parcel": {
		include: [".parcel-cache"],
		tags: ["cache", "parcel", "build"],
	},
	"esbuild": {
		include: [".esbuild", "node_modules/.cache/esbuild"],
		tags: ["cache", "esbuild", "build"],
	},
	"swc": {
		include: [".swc", "node_modules/.cache/swc"],
		tags: ["cache", "swc", "build"],
	},
	"vitest": {
		include: [".vitest"],
		tags: ["cache", "vitest", "test"],
	},
	"jest": {
		include: [".jest-cache", "node_modules/.cache/jest"],
		tags: ["cache", "jest", "test"],
	},
	"playwright": {
		include: ["playwright-report", "test-results"],
		tags: ["playwright", "test", "artifacts"],
	},
	"cypress": {
		include: ["cypress/screenshots", "cypress/videos"],
		tags: ["cypress", "test", "artifacts"],
	},
	"docusaurus": {
		include: [".docusaurus"],
		tags: ["docusaurus", "docs", "cache"],
	},
	"nx": {
		include: [".nx", "node_modules/.cache/nx"],
		tags: ["nx", "monorepo", "cache"],
	},
	"serverless": {
		include: [".serverless"],
		tags: ["serverless", "infra", "artifacts"],
	},
	"sst": {
		include: [".sst"],
		tags: ["sst", "infra", "cache"],
	},
	"pnpm-store": {
		include: [".pnpm-store"],
		tags: ["pnpm", "package-manager", "cache"],
	},
	"npm-cache": {
		include: [".npm"],
		tags: ["npm", "package-manager", "cache"],
	},
	"yarn-cache": {
		include: [".yarn/cache", ".yarn/unplugged"],
		tags: ["yarn", "package-manager", "cache"],
	},
	"bun-cache": {
		include: [".bun/install/cache"],
		tags: ["bun", "package-manager", "cache"],
	},
};
