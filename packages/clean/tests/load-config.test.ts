/** @format */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "../src/load-config.js";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, ".test-temp");

beforeEach(() => {
	mkdirSync(tempDir, { recursive: true });
});

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true });
});

describe("loadConfig", () => {
	it("loads default config when no config file exists", async () => {
		const config = await loadConfig(tempDir);

		expect(config.defaults.include).toEqual([]);
		expect(config.defaults.exclude).toEqual([]);
		expect(config.commands).toEqual({});
		expect(config.configDir).toEqual(tempDir);
	});

	it("loads include/exclude config from .cleanrc.json", async () => {
		const configPath = path.join(tempDir, ".cleanrc.json");
		writeFileSync(
			configPath,
			JSON.stringify({
				include: [".global-cache/**"],
				exclude: ["**/*.tmp"],
				dryRun: true,
				tags: ["global"],
				commands: {
					turbo: {
						include: [".turbo/**"],
						tags: ["cache"],
					},
					abcd: {
						include: [".cache-abcd/**"],
						mode: "contentsOnly",
					},
				},
			}),
		);

		const config = await loadConfig(tempDir);

		expect(config.defaults.include).toEqual([".global-cache/**"]);
		expect(config.defaults.exclude).toEqual(["**/*.tmp"]);
		expect(config.defaults.dryRun).toBe(true);
		expect(config.defaults.tags).toEqual(["global"]);
		expect(config.commands.turbo?.include).toEqual([".turbo/**"]);
		expect(config.commands.turbo?.tags).toEqual(["cache"]);
		expect(config.commands.abcd?.mode).toBe("contentsOnly");
	});

	it("loads config from package.json clean key", async () => {
		const packageJsonPath = path.join(tempDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify({
				name: "test",
				clean: {
					include: [".build/**"],
					commands: {
						turbo: {
							include: [".turbo/**"],
						},
					},
				},
			}),
		);

		const config = await loadConfig(tempDir);

		expect(config.defaults.include).toEqual([".build/**"]);
		expect(config.commands.turbo?.include).toEqual([".turbo/**"]);
	});

	it("supports backward compatibility with vesta:clean", async () => {
		const packageJsonPath = path.join(tempDir, "package.json");
		writeFileSync(
			packageJsonPath,
			JSON.stringify({
				"name": "test",
				"vesta:clean": {
					dirs: [".legacy"],
				},
			}),
		);

		const config = await loadConfig(tempDir);

		expect(config.defaults.include).toEqual([".legacy"]);
	});

	it("supports backward compatibility with legacy command keys", async () => {
		const configPath = path.join(tempDir, ".cleanrc.json");
		writeFileSync(
			configPath,
			JSON.stringify({
				clean: [".legacy-global"],
				installClean: [
					".legacy-install",
					"node_modules",
				],
				buildClean: [".legacy-build"],
				devClean: [".legacy-dev"],
			}),
		);

		const config = await loadConfig(tempDir);

		expect(config.defaults.include).toEqual([".legacy-global"]);
		expect(config.commands.install?.include).toEqual([
			".legacy-install",
			"node_modules",
		]);
		expect(config.commands["build:clean"]?.include).toEqual([
			".legacy-build",
		]);
		expect(config.commands["dev:clean"]?.include).toEqual([
			".legacy-dev",
		]);
	});

	it("resolves config directory from nested config files", async () => {
		const nested = path.join(tempDir, "nested");
		mkdirSync(nested, { recursive: true });
		writeFileSync(
			path.join(nested, ".cleanrc.json"),
			JSON.stringify({
				include: ["./dist/**"],
			}),
		);

		const config = await loadConfig(nested);
		expect(config.configDir).toEqual(nested);
	});
});
