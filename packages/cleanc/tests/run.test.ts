/** @format */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runClean } from "../src/run.js";
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, ".test-temp-run");

const makeConfig = () => ({
	configDir: tempDir,
	defaults: {
		include: [],
		exclude: [],
		tags: [],
		enabled: true,
		mode: "delete" as const,
		dryRun: false,
		confirm: false,
		interactive: false,
		verbose: false,
		ignoreErrors: false,
		protect: [],
		strategy: "sequential" as const,
		force: false,
		report: "none" as const,
	},
	commands: {
		turbo: {
			include: [".turbo/**"],
			exclude: [],
			tags: ["cache"],
			enabled: true,
			mode: "delete" as const,
			dryRun: false,
			confirm: false,
			interactive: false,
			verbose: false,
			ignoreErrors: false,
			protect: [],
			strategy: "sequential" as const,
			force: false,
			report: "none" as const,
		},
	},
});

beforeEach(() => {
	mkdirSync(tempDir, { recursive: true });
});

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true });
});

describe("runClean", () => {
	it("deletes global include patterns with bare command", async () => {
		const globalDir = path.join(tempDir, ".global-cache");
		mkdirSync(globalDir, { recursive: true });
		writeFileSync(path.join(globalDir, "test.txt"), "test");

		const config = makeConfig();
		config.defaults.include = [".global-cache"];

		await runClean(config, {});

		expect(existsSync(globalDir)).toBe(false);
	});

	it("merges global and command includes for named command", async () => {
		const turbo = path.join(tempDir, ".turbo");
		const globalDir = path.join(tempDir, ".global-cache");
		mkdirSync(turbo, { recursive: true });
		mkdirSync(globalDir, { recursive: true });

		const config = makeConfig();
		config.defaults.include = [".global-cache"];
		config.commands.turbo.include = [".turbo"];

		await runClean(config, { command: "turbo" });

		expect(existsSync(turbo)).toBe(false);
		expect(existsSync(globalDir)).toBe(false);
	});

	it("allows CLI include override", async () => {
		const custom = path.join(tempDir, ".custom");
		const globalDir = path.join(tempDir, ".global-cache");
		mkdirSync(custom, { recursive: true });
		mkdirSync(globalDir, { recursive: true });

		const config = makeConfig();
		config.defaults.include = [".global-cache"];

		await runClean(config, {
			command: "turbo",
			include: [".custom"],
		});

		expect(existsSync(custom)).toBe(false);
		expect(existsSync(globalDir)).toBe(true); // Should not be deleted when override is provided
	});

	it("supports include + exclude filtering", async () => {
		const keep = path.join(tempDir, "keep.log");
		const remove = path.join(tempDir, "remove.tmp");
		writeFileSync(keep, "keep");
		writeFileSync(remove, "remove");

		const config = makeConfig();
		config.commands.turbo.include = ["*.log", "*.tmp"];
		config.commands.turbo.exclude = ["**/*.log"];

		await runClean(config, { command: "turbo" });

		expect(existsSync(keep)).toBe(true);
		expect(existsSync(remove)).toBe(false);
	});

	it("supports mode=contentsOnly", async () => {
		const targetDir = path.join(tempDir, ".turbo");
		const child = path.join(targetDir, "inner.txt");
		mkdirSync(targetDir, { recursive: true });
		writeFileSync(child, "hello");

		const config = makeConfig();
		config.commands.turbo.include = [".turbo"];
		config.commands.turbo.mode = "contentsOnly";

		await runClean(config, { command: "turbo" });

		expect(existsSync(targetDir)).toBe(true);
		expect(existsSync(child)).toBe(false);
	});

	it("supports tag selection with union behavior", async () => {
		const turboDir = path.join(tempDir, ".turbo");
		const wranglerDir = path.join(tempDir, ".wrangler");
		mkdirSync(turboDir, { recursive: true });
		mkdirSync(wranglerDir, { recursive: true });

		const config = makeConfig();
		config.commands.wrangler = {
			...config.commands.turbo,
			include: [".wrangler"],
			tags: ["cache", "cloudflare"],
		};

		config.commands.turbo.include = [".turbo"];
		await runClean(config, { tags: ["cache"] });

		expect(existsSync(turboDir)).toBe(false);
		expect(existsSync(wranglerDir)).toBe(false);
	});

	it("supports tag-intersect when command and tags are both passed", async () => {
		const turboDir = path.join(tempDir, ".turbo");
		mkdirSync(turboDir, { recursive: true });

		const config = makeConfig();
		config.commands.turbo.include = [".turbo"];
		await runClean(config, {
			command: "turbo",
			tags: ["cache"],
			tagIntersect: true,
		});

		expect(existsSync(turboDir)).toBe(false);
	});

	it("supports dryRun without deleting files", async () => {
		const turboDir = path.join(tempDir, ".turbo");
		mkdirSync(turboDir, { recursive: true });

		const config = makeConfig();
		await runClean(config, { command: "turbo", dryRun: true });

		expect(existsSync(turboDir)).toBe(true);
	});

	it("writes json report when report=json", async () => {
		const turboDir = path.join(tempDir, ".turbo");
		mkdirSync(turboDir, { recursive: true });

		const config = makeConfig();
		const logs: string[] = [];
		const originalLog = console.log;
		console.log = (message?: unknown) => logs.push(String(message));
		try {
			await runClean(config, {
				command: "turbo",
				report: "json",
			});
		} finally {
			console.log = originalLog;
		}

		const json = logs.find((line) =>
			line.includes('"removedTargets"'),
		);
		expect(json).toBeDefined();
	});

	it("fails with available commands when command is unknown", async () => {
		const config = makeConfig();
		config.commands.wrangler = {
			...config.commands.turbo,
			include: [".wrangler/**"],
			tags: ["cloudflare"],
		};

		await expect(async () => {
			await runClean(config, { command: "abcd" });
		}).rejects.toThrow(
			'Unknown command "abcd". Available commands: turbo, wrangler',
		);
	});

	it("respects protect patterns", async () => {
		const lockFile = path.join(tempDir, "pnpm-lock.yaml");
		writeFileSync(lockFile, "lock");
		const config = makeConfig();
		config.defaults.include = ["pnpm-lock.yaml"];
		config.defaults.protect = ["pnpm-lock.yaml"];

		await runClean(config, {});
		expect(readFileSync(lockFile, "utf-8")).toBe("lock");
	});
});
