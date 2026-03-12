/** @format */

import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { BUILT_IN_COMMANDS } from "./built-ins.js";
import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import type { CleanCommandsMap } from "./built-ins.js";

export interface InitOptions {
	cwd?: string;
	skipDeps?: boolean;
	tools?: string[];
	promptForBuiltIns?: boolean;
}

/**
 * Detect package manager from lockfile.
 */
function _detectPackageManager(cwd: string): "pnpm" | "npm" | "yarn" {
	if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
	if (existsSync(path.join(cwd, "yarn.lock"))) return "yarn";
	if (existsSync(path.join(cwd, "package-lock.json"))) return "npm";
	return "pnpm"; // Default
}

/**
 * Check if clean config exists.
 */
function hasCleanConfig(cwd: string): boolean {
	// Check for rc files
	const rcFiles = [
		".cleanrc",
		".cleanrc.json",
		".cleanrc.yaml",
		".cleanrc.yml",
		".cleanrc.cjs",
		".cleanrc.mjs",
		".cleanrc.js",
	];
	if (rcFiles.some((f) => existsSync(path.join(cwd, f)))) return true;

	// Check for clean.config.*
	const configFiles = [
		"clean.config.cjs",
		"clean.config.mjs",
		"clean.config.js",
	];
	if (configFiles.some((f) => existsSync(path.join(cwd, f)))) return true;

	// Check package.json for clean key
	try {
		const packageJsonPath = path.join(cwd, "package.json");
		if (existsSync(packageJsonPath)) {
			const pkg = JSON.parse(
				readFileSync(packageJsonPath, "utf-8"),
			);
			if (pkg.clean) return true;
		}
	} catch {
		// Ignore
	}

	return false;
}

/**
 * Create default .cleanrc.json config.
 */
const pickBuiltIns = (names: string[]): CleanCommandsMap => {
	const selected: CleanCommandsMap = {};
	for (const name of names) {
		const template = BUILT_IN_COMMANDS[name];
		if (!template) {
			const available = Object.keys(BUILT_IN_COMMANDS)
				.sort()
				.join(", ");
			throw new Error(
				`Unknown built-in "${name}". Available built-ins: ${available}`,
			);
		}
		selected[name] = {
			...template,
			include: [...template.include],
			exclude:
				template.exclude ?
					[...template.exclude]
				:	undefined,
			tags: template.tags ? [...template.tags] : undefined,
			protect:
				template.protect ?
					[...template.protect]
				:	undefined,
		};
	}
	return selected;
};

const promptForBuiltIns = async (): Promise<CleanCommandsMap> => {
	if (!input.isTTY || !output.isTTY) {
		return pickBuiltIns(["install"]);
	}

	const rl = createInterface({ input, output });
	const selected: string[] = [];

	try {
		console.log(
			"Select built-in commands to include in .cleanrc.json",
		);
		console.log(
			"Press Enter to accept the default shown in brackets.",
		);

		for (const name of Object.keys(BUILT_IN_COMMANDS)) {
			const defaultYes = name === "install";
			const answer = (
				await new Promise<string>((resolve) => {
					rl.question(
						`- include "${name}"? ${defaultYes ? "[Y/n]" : "[y/N]"} `,
						resolve,
					);
				})
			)
				.trim()
				.toLowerCase();
			const include =
				answer === "" ? defaultYes : (
					answer === "y" || answer === "yes"
				);
			if (include) {
				selected.push(name);
			}
		}
	} finally {
		rl.close();
	}

	return pickBuiltIns(selected);
};

function createDefaultConfig(cwd: string, commands: CleanCommandsMap): void {
	if (hasCleanConfig(cwd)) {
		return; // Don't overwrite existing config
	}

	const config = {
		include: [],
		exclude: [],
		report: "summary",
		protect: [
			".git/**",
			"pnpm-lock.yaml",
			"package-lock.json",
			"yarn.lock",
		],
		commands,
	};

	const configPath = path.join(cwd, ".cleanrc.json");
	writeFileSync(configPath, JSON.stringify(config, null, 2));
	console.log(`Created: .cleanrc.json`);
}

/**
 * Add or update npm scripts in package.json.
 */
function addScripts(cwd: string): void {
	const packageJsonPath = path.join(cwd, "package.json");
	const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

	const scriptsToAdd = {
		"clean": "clean",
		"install:clean": "clean install:clean && pnpm i",
		"build:clean": "clean build:clean && pnpm run build",
		"dev:clean": "clean dev:clean && pnpm run dev",
	};

	// Only add scripts if they're missing
	let modified = false;
	for (const [key, value] of Object.entries(scriptsToAdd)) {
		if (!pkg.scripts?.[key]) {
			if (!pkg.scripts) pkg.scripts = {};
			pkg.scripts[key] = value;
			modified = true;
		}
	}

	if (modified) {
		writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
		console.log(
			`Added scripts: ${Object.keys(scriptsToAdd)
				.filter((k) => !pkg.scripts[k])
				.join(", ")}`,
		);
	}
}

/**
 * Initialize clean in a project.
 */
export async function initClean(options: InitOptions = {}): Promise<void> {
	const cwd = options.cwd ?? process.cwd();
	const shouldPrompt = options.promptForBuiltIns ?? true;

	let selectedBuiltIns: CleanCommandsMap;
	if (options.tools) {
		selectedBuiltIns = pickBuiltIns(options.tools);
	} else if (shouldPrompt) {
		selectedBuiltIns = await promptForBuiltIns();
	} else {
		selectedBuiltIns = pickBuiltIns(["install"]);
	}

	console.log(`Initializing clean in ${cwd}`);

	// Create default config if none exists
	createDefaultConfig(cwd, selectedBuiltIns);

	// Add scripts to package.json
	try {
		addScripts(cwd);
	} catch (error) {
		console.error("Failed to add scripts:", error);
	}

	console.log("✓ clean initialized");
}
