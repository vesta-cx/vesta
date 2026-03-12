/** @format */

import { createInterface } from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { readdir, rm, stat } from "node:fs/promises";
import path from "path";
import type { CleanMode, CleanReportMode, CleanStrategy } from "./built-ins.js";
import type { NormalizedConfig, NormalizedEntry } from "./load-config.js";

export interface RunOptions {
	command?: string;
	cwd?: string;
	include?: string[];
	exclude?: string[];
	mode?: CleanMode;
	dryRun?: boolean;
	confirm?: boolean;
	verbose?: boolean;
	ignoreErrors?: boolean;
	protect?: string[];
	strategy?: CleanStrategy;
	enabled?: boolean;
	force?: boolean;
	interactive?: boolean;
	report?: CleanReportMode;
	tags?: string[];
	tagIntersect?: boolean;
}

const resolveCommandAlias = (command?: string): string | undefined => {
	if (!command) return undefined;
	if (command === "clean") return undefined;
	if (command === "install:clean") return "install";
	return command;
};

interface FileEntry {
	abs: string;
	rel: string;
	isDir: boolean;
}

interface RunSummary {
	executedCommands: string[];
	matchedTargets: number;
	removedTargets: number;
	skippedProtected: number;
	errors: string[];
}

const toPosix = (value: string): string => value.split(path.sep).join("/");

const normalizePattern = (pattern: string): string =>
	toPosix(pattern.trim()).replace(/^\.\/+/, "");

const resolveRoot = (
	configDir: string,
	baseCwd?: string,
	cliCwd?: string,
): string => {
	const root =
		cliCwd ??
		(baseCwd ? path.resolve(configDir, baseCwd) : configDir);
	return path.resolve(root);
};

const assertInsideRoot = (target: string, root: string): void => {
	const relative = path.relative(root, target);
	if (relative.startsWith("..") || path.isAbsolute(relative)) {
		throw new Error(
			`Path traversal detected: ${target} attempts to escape ${root}`,
		);
	}
};

const hasWildcard = (pattern: string): boolean => /[*?[\]{}]/.test(pattern);

const matchesPattern = (rel: string, pattern: string): boolean => {
	const normalizedPattern = normalizePattern(pattern);
	if (!normalizedPattern) return false;
	if (path.matchesGlob(rel, normalizedPattern)) return true;
	return rel.startsWith(`${normalizedPattern}/`);
};

const listEntriesRecursive = async (root: string): Promise<FileEntry[]> => {
	const entries: FileEntry[] = [];

	const walk = async (current: string): Promise<void> => {
		const dirEntries = await readdir(current, {
			withFileTypes: true,
		});
		for (const dirent of dirEntries) {
			const abs = path.join(current, dirent.name);
			assertInsideRoot(abs, root);
			const rel = toPosix(path.relative(root, abs));
			const isDir = dirent.isDirectory();
			entries.push({ abs, rel, isDir });
			if (isDir) {
				await walk(abs);
			}
		}
	};

	await walk(root);
	return entries;
};

const expandTargets = async (
	root: string,
	include: string[],
	exclude: string[],
): Promise<FileEntry[]> => {
	const entries = await listEntriesRecursive(root);
	const byAbs = new Map<string, FileEntry>();

	for (const pattern of include.map(normalizePattern).filter(Boolean)) {
		if (hasWildcard(pattern)) {
			for (const entry of entries) {
				if (matchesPattern(entry.rel, pattern)) {
					byAbs.set(entry.abs, entry);
				}
			}
			continue;
		}

		const absLiteral = path.resolve(root, pattern);
		if (absLiteral !== root) {
			assertInsideRoot(absLiteral, root);
			try {
				const stats = await stat(absLiteral);
				const rel = toPosix(
					path.relative(root, absLiteral),
				);
				byAbs.set(absLiteral, {
					abs: absLiteral,
					rel,
					isDir: stats.isDirectory(),
				});
			} catch {
				// Missing literal patterns are ignored.
			}
		}
	}

	const excluded = exclude.map(normalizePattern).filter(Boolean);
	const filtered = [...byAbs.values()].filter(
		(entry) =>
			!excluded.some((pattern) =>
				matchesPattern(entry.rel, pattern),
			),
	);
	return filtered;
};

const isProtected = (rel: string, protect: string[]): boolean =>
	protect.some((pattern) => matchesPattern(rel, pattern));

const promptConfirm = async (message: string): Promise<boolean> => {
	if (!input.isTTY || !output.isTTY) return false;
	const rl = createInterface({ input, output });
	try {
		const answer = await new Promise<string>((resolve) => {
			rl.question(`${message} [y/N] `, (value) =>
				resolve(value),
			);
		});
		const normalized = answer.trim().toLowerCase();
		return normalized === "y" || normalized === "yes";
	} finally {
		rl.close();
	}
};

const mergeEntry = (
	defaults: NormalizedEntry,
	entry?: NormalizedEntry,
): NormalizedEntry => {
	if (!entry) return { ...defaults };
	return {
		...defaults,
		...entry,
		include: [...defaults.include, ...entry.include],
		exclude: [...defaults.exclude, ...entry.exclude],
		tags: [...new Set([...defaults.tags, ...entry.tags])],
		protect: [...new Set([...defaults.protect, ...entry.protect])],
	};
};

const applyCliOverrides = (
	entry: NormalizedEntry,
	options: RunOptions,
): NormalizedEntry => ({
	...entry,
	include: options.include ?? entry.include,
	exclude: options.exclude ?? entry.exclude,
	mode: options.mode ?? entry.mode,
	dryRun: options.dryRun ?? entry.dryRun,
	confirm: options.confirm ?? entry.confirm,
	verbose: options.verbose ?? entry.verbose,
	ignoreErrors: options.ignoreErrors ?? entry.ignoreErrors,
	protect: options.protect ?? entry.protect,
	strategy: options.strategy ?? entry.strategy,
	enabled: options.enabled ?? entry.enabled,
	force: options.force ?? entry.force,
	interactive: options.interactive ?? entry.interactive,
	report: options.report ?? entry.report,
});

const selectCommands = (
	config: NormalizedConfig,
	options: RunOptions,
): string[] => {
	const explicit = resolveCommandAlias(options.command);
	if (explicit && !config.commands[explicit]) {
		const available =
			Object.keys(config.commands).sort().join(", ") ||
			"(none)";
		throw new Error(
			`Unknown command "${options.command}". Available commands: ${available}`,
		);
	}

	const requestedTags = (options.tags ?? [])
		.map((tag) => tag.trim())
		.filter(Boolean);
	const matchesByTag =
		requestedTags.length === 0 ?
			[]
		:	Object.entries(config.commands)
				.filter(([, entry]) =>
					entry.tags.some((tag) =>
						requestedTags.includes(tag),
					),
				)
				.map(([name]) => name);

	if (!explicit && requestedTags.length === 0) return [];
	if (explicit && requestedTags.length === 0) return [explicit];
	if (!explicit && requestedTags.length > 0)
		return [...new Set(matchesByTag)];

	if (options.tagIntersect) {
		const intersect = matchesByTag.includes(explicit as string);
		return intersect && explicit ? [explicit] : [];
	}

	return [...new Set([explicit as string, ...matchesByTag])];
};

const removeTarget = async (
	entry: FileEntry,
	mode: CleanMode,
): Promise<void> => {
	if (mode === "delete") {
		await rm(entry.abs, { recursive: true, force: true });
		return;
	}

	if (!entry.isDir) {
		await rm(entry.abs, { force: true });
		return;
	}

	const children = await readdir(entry.abs);
	await Promise.all(
		children.map((child) =>
			rm(path.join(entry.abs, child), {
				recursive: true,
				force: true,
			}),
		),
	);
};

const maybeReport = (summary: RunSummary, mode: CleanReportMode): void => {
	if (mode === "none") return;
	if (mode === "json") {
		console.log(JSON.stringify(summary, null, 2));
		return;
	}
	console.log(
`clean: commands=${summary.executedCommands.join(",") || "(global)"} matched=${summary.matchedTargets} removed=${summary.removedTargets} protected=${summary.skippedProtected} errors=${summary.errors.length}`,
	);
};

/**
 * Run cleanup based on include/exclude patterns and runtime options.
 */
export async function runClean(
	config: NormalizedConfig,
	options: RunOptions,
): Promise<void> {
	const commandNames = selectCommands(config, options);
	const runs = commandNames.length > 0 ? commandNames : [undefined];

	const summary: RunSummary = {
		executedCommands: runs.map((name) => name ?? "global"),
		matchedTargets: 0,
		removedTargets: 0,
		skippedProtected: 0,
		errors: [],
	};

	for (const commandName of runs) {
		const merged = mergeEntry(
			config.defaults,
			commandName ? config.commands[commandName] : undefined,
		);
		const effective = applyCliOverrides(merged, options);

		if (!effective.enabled) {
			if (effective.verbose) {
				console.log(
					`Skipping ${commandName ?? "global"} (enabled=false)`,
				);
			}
			continue;
		}

		const root = resolveRoot(
			config.configDir,
			effective.cwd,
			options.cwd,
		);
		const targets = await expandTargets(
			root,
			effective.include,
			effective.exclude,
		);
		summary.matchedTargets += targets.length;

		const protectedTargets = targets.filter((target) =>
			isProtected(target.rel, effective.protect),
		);
		summary.skippedProtected += protectedTargets.length;
		const removable = targets.filter(
			(target) => !isProtected(target.rel, effective.protect),
		);

		if (effective.confirm) {
			if (!effective.force) {
				if (!effective.interactive) {
					throw new Error(
						"Confirmation required but interactive mode is disabled. Use --interactive or --force.",
					);
				}
				const ok = await promptConfirm(
					`Delete ${removable.length} matched targets for ${commandName ?? "global"}?`,
				);
				if (!ok) {
					throw new Error(
						"Operation cancelled by user.",
					);
				}
			}
		}

		const deleteOne = async (target: FileEntry): Promise<void> => {
			if (effective.dryRun) {
				if (effective.verbose) {
					console.log(
						`[dryRun] would remove: ${target.rel}`,
					);
				}
				return;
			}

			await removeTarget(target, effective.mode);
			summary.removedTargets += 1;
			if (effective.verbose) {
				console.log(`Removed: ${target.rel}`);
			}
		};

		const removeAll = async (): Promise<void> => {
			if (effective.strategy === "parallel") {
				await Promise.all(removable.map(deleteOne));
			} else {
				for (const target of removable) {
					await deleteOne(target);
				}
			}
		};

		try {
			await removeAll();
		} catch (error) {
			const message =
				error instanceof Error ?
					error.message
				:	String(error);
			summary.errors.push(message);
			if (!effective.ignoreErrors) {
				throw error;
			}
			if (effective.verbose) {
				console.error(
					`Ignored error (${commandName ?? "global"}): ${message}`,
				);
			}
		}
	}

	const reportMode = options.report ?? config.defaults.report;
	maybeReport(summary, reportMode);

	if (
		summary.errors.length > 0 &&
		!(options.ignoreErrors ?? config.defaults.ignoreErrors)
	) {
		throw new Error(
			`clean completed with ${summary.errors.length} error(s).`,
		);
	}
}
