/** @format */

import { cosmiconfig } from "cosmiconfig";
import path from "path";
import type { CleanMode, CleanReportMode, CleanStrategy } from "./built-ins.js";

export interface CleanConfig {
	include?: string[];
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
	commands?: Record<string, CleanConfig | string[]>;

	// Legacy compatibility
	dirs?: string[];
	clean?: string[];
	installClean?: string[];
	buildClean?: string[];
	devClean?: string[];
}

export interface NormalizedEntry {
	include: string[];
	exclude: string[];
	tags: string[];
	enabled: boolean;
	mode: CleanMode;
	dryRun: boolean;
	confirm: boolean;
	interactive: boolean;
	verbose: boolean;
	ignoreErrors: boolean;
	protect: string[];
	strategy: CleanStrategy;
	force: boolean;
	cwd?: string;
	report: CleanReportMode;
}

export interface NormalizedConfig {
	configDir: string;
	defaults: NormalizedEntry;
	commands: Record<string, NormalizedEntry>;
}

const DEFAULT_ENTRY: NormalizedEntry = {
	include: [],
	exclude: [],
	tags: [],
	enabled: true,
	mode: "delete",
	dryRun: false,
	confirm: false,
	interactive: false,
	verbose: false,
	ignoreErrors: false,
	protect: [
		".git/**",
		".svn/**",
		".hg/**",
		"package-lock.json",
		"pnpm-lock.yaml",
		"yarn.lock",
	],
	strategy: "sequential",
	force: false,
	report: "summary",
};

const toStringArray = (value: unknown): string[] | undefined => {
	if (!Array.isArray(value)) return undefined;
	const strings = value
		.filter((entry): entry is string => typeof entry === "string")
		.map((entry) => entry.trim())
		.filter(Boolean);
	return strings.length > 0 ? strings : [];
};

const toBoolean = (value: unknown, fallback: boolean): boolean => {
	if (typeof value === "boolean") return value;
	return fallback;
};

const toMode = (value: unknown, fallback: CleanMode): CleanMode => {
	return value === "contentsOnly" || value === "delete" ?
			value
		:	fallback;
};

const toStrategy = (value: unknown, fallback: CleanStrategy): CleanStrategy => {
	return value === "parallel" || value === "sequential" ?
			value
		:	fallback;
};

const toReport = (
	value: unknown,
	fallback: CleanReportMode,
): CleanReportMode => {
	return value === "none" || value === "summary" || value === "json" ?
			value
		:	fallback;
};

const toOptionalString = (value: unknown): string | undefined => {
	return typeof value === "string" && value.trim().length > 0 ?
			value.trim()
		:	undefined;
};

const normalizeEntry = (
	value: unknown,
	base?: NormalizedEntry,
): NormalizedEntry => {
	const fallback = base ?? DEFAULT_ENTRY;
	if (!value || typeof value !== "object") {
		return { ...fallback };
	}

	const raw = value as CleanConfig;
	const includeFromLegacy =
		toStringArray(raw.dirs) ?? toStringArray(raw.clean);

	return {
		include: toStringArray(raw.include) ??
			includeFromLegacy ?? [...fallback.include],
		exclude: toStringArray(raw.exclude) ?? [...fallback.exclude],
		tags: toStringArray(raw.tags) ?? [...fallback.tags],
		enabled: toBoolean(raw.enabled, fallback.enabled),
		mode: toMode(raw.mode, fallback.mode),
		dryRun: toBoolean(raw.dryRun, fallback.dryRun),
		confirm: toBoolean(raw.confirm, fallback.confirm),
		interactive: toBoolean(raw.interactive, fallback.interactive),
		verbose: toBoolean(raw.verbose, fallback.verbose),
		ignoreErrors: toBoolean(
			raw.ignoreErrors,
			fallback.ignoreErrors,
		),
		protect: toStringArray(raw.protect) ?? [...fallback.protect],
		strategy: toStrategy(raw.strategy, fallback.strategy),
		force: toBoolean(raw.force, fallback.force),
		cwd: toOptionalString(raw.cwd) ?? fallback.cwd,
		report: toReport(raw.report, fallback.report),
	};
};

const normalizeCommands = (
	commands: unknown,
	defaults: NormalizedEntry,
): Record<string, NormalizedEntry> => {
	if (!commands || typeof commands !== "object") return {};
	const normalized: Record<string, NormalizedEntry> = {};

	for (const [name, config] of Object.entries(
		commands as Record<string, unknown>,
	)) {
		const trimmedName = name.trim();
		if (!trimmedName) continue;

		if (Array.isArray(config)) {
			normalized[trimmedName] = normalizeEntry(
				{ include: config },
				defaults,
			);
			continue;
		}

		normalized[trimmedName] = normalizeEntry(config, defaults);
	}

	return normalized;
};

export async function loadConfig(
	cwd: string = process.cwd(),
): Promise<NormalizedConfig> {
const explorer = cosmiconfig("clean", {
		searchPlaces: [
			".cleanrc",
			".cleanrc.json",
			".cleanrc.yaml",
			".cleanrc.yml",
			".cleanrc.cjs",
			".cleanrc.mjs",
			".cleanrc.js",
			"clean.config.cjs",
			"clean.config.mjs",
			"clean.config.js",
			"package.json",
		],
	});

	const result = await explorer.search(cwd);

	let config: CleanConfig = {};
	let configDir = cwd;

	if (result?.config) {
		config = result.config;
		if (result.filepath) {
			configDir = path.dirname(result.filepath);
		}
	} else {
		// Check for backward compatibility with vesta:clean or cleanDirs in package.json
		try {
			const packageJsonPath = path.join(cwd, "package.json");
			const fs = await import("fs");
			const packageJson = JSON.parse(
				fs.readFileSync(packageJsonPath, "utf-8"),
			);
			if (packageJson["vesta:clean"]?.dirs) {
				config.include =
					packageJson["vesta:clean"].dirs;
			} else if (packageJson.cleanDirs) {
				config.include = packageJson.cleanDirs;
			}
		} catch {
			// Silently ignore if package.json doesn't exist or can't be parsed
		}
	}

	const defaults = normalizeEntry(config);
	const commands = normalizeCommands(config.commands, defaults);

	const installFromLegacy = toStringArray(config.installClean);
	const buildFromLegacy = toStringArray(config.buildClean);
	const devFromLegacy = toStringArray(config.devClean);

	// Backward compatibility from legacy keys.
	if (installFromLegacy && commands.install === undefined) {
		commands.install = normalizeEntry(
			{ include: installFromLegacy },
			defaults,
		);
	}
	if (buildFromLegacy && commands["build:clean"] === undefined) {
		commands["build:clean"] = normalizeEntry(
			{ include: buildFromLegacy },
			defaults,
		);
	}
	if (devFromLegacy && commands["dev:clean"] === undefined) {
		commands["dev:clean"] = normalizeEntry(
			{ include: devFromLegacy },
			defaults,
		);
	}

	return {
		configDir,
		defaults,
		commands,
	};
}
