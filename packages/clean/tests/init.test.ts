/** @format */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initClean } from "../src/init.js";
import { BUILT_IN_COMMANDS } from "../src/built-ins.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, ".test-temp-init");

beforeEach(() => {
	mkdirSync(tempDir, { recursive: true });
	writeFileSync(
		path.join(tempDir, "package.json"),
		JSON.stringify({
			name: "init-test",
			scripts: {},
		}),
	);
});

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true });
});

describe("initClean", () => {
	it("defaults to install built-in when not interactive", async () => {
		await initClean({ cwd: tempDir });

		const config = JSON.parse(
			readFileSync(
				path.join(tempDir, ".cleanrc.json"),
				"utf-8",
			),
		) as {
			include?: string[];
			commands?: Record<string, { include: string[] }>;
		};

		expect(config.include).toEqual([]);
		expect(config.commands).toEqual({
			install: BUILT_IN_COMMANDS.install,
		});
	});

	it("uses explicit built-ins without prompting", async () => {
		await initClean({
			cwd: tempDir,
			tools: ["install", "turbo"],
			promptForBuiltIns: false,
		});

		const config = JSON.parse(
			readFileSync(
				path.join(tempDir, ".cleanrc.json"),
				"utf-8",
			),
		) as {
			include?: string[];
			commands?: Record<string, { include: string[] }>;
		};

		expect(config.commands).toEqual({
			install: BUILT_IN_COMMANDS.install,
			turbo: BUILT_IN_COMMANDS.turbo,
		});
	});

	it("keeps init output aligned with all built-ins", async () => {
		await initClean({
			cwd: tempDir,
			tools: Object.keys(BUILT_IN_COMMANDS),
			promptForBuiltIns: false,
		});

		const config = JSON.parse(
			readFileSync(
				path.join(tempDir, ".cleanrc.json"),
				"utf-8",
			),
		) as {
			include?: string[];
			commands?: Record<string, { include: string[] }>;
		};

		expect(config.commands).toEqual(BUILT_IN_COMMANDS);
	});

	it("throws when an unknown built-in is provided", async () => {
		await expect(
			initClean({
				cwd: tempDir,
				tools: ["definitely-not-real"],
				promptForBuiltIns: false,
			}),
		).rejects.toThrow('Unknown built-in "definitely-not-real"');
	});
});
