/** @format */

import { describe, expect, it } from "vitest";
import { BUILT_IN_COMMANDS } from "../src/built-ins.js";

describe("BUILT_IN_COMMANDS", () => {
	const expectedCommands = [
		"angular",
		"astro",
		"bun-cache",
		"cypress",
		"docusaurus",
		"esbuild",
		"install",
		"jest",
		"next",
		"npm-cache",
		"nuxt",
		"nx",
		"parcel",
		"playwright",
		"pnpm-store",
		"remix",
		"rollup",
		"serverless",
		"sst",
		"storybook",
		"svelte",
		"swc",
		"turbo",
		"vite",
		"vitest",
		"webpack",
		"wrangler",
		"yarn-cache",
	] as const;

	it("defines install command with node_modules cleanup", () => {
		expect(BUILT_IN_COMMANDS.install?.include).toEqual([
			"node_modules",
		]);
	});

	it("contains the full recommended built-in command set", () => {
		expect(Object.keys(BUILT_IN_COMMANDS).sort()).toEqual(
			[...expectedCommands].sort(),
		);
	});

	it("has only non-empty relative include entries", () => {
		for (const command of Object.values(BUILT_IN_COMMANDS)) {
			expect(command.include.length).toBeGreaterThan(0);
			for (const dir of command.include) {
				expect(typeof dir).toBe("string");
				expect(dir.length).toBeGreaterThan(0);
				expect(dir.startsWith("/")).toBe(false);
				expect(dir.startsWith("~")).toBe(false);
			}
		}
	});
});
