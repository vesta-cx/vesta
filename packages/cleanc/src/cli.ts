#!/usr/bin/env node

/** @format */

import { loadConfig } from "./load-config.js";
import { runClean, type RunOptions } from "./run.js";
import { initClean } from "./init.js";
import type { CleanMode, CleanReportMode, CleanStrategy } from "./built-ins.js";

interface ParsedArgs {
	command?: string;
	isInit: boolean;
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
	tagIntersect: boolean;
	tools?: string[];
	noPrompt: boolean;
}

const parseBooleanFlag = (raw: string | undefined): boolean | undefined => {
	if (raw === undefined) return true;
	const normalized = raw.trim().toLowerCase();
	if (
		normalized === "true" ||
		normalized === "1" ||
		normalized === "yes" ||
		normalized === "y"
	)
		return true;
	if (
		normalized === "false" ||
		normalized === "0" ||
		normalized === "no" ||
		normalized === "n"
	)
		return false;
	return undefined;
};

const parseCsv = (value: string): string[] =>
	value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);

/**
 * Parse command-line arguments.
 */
function parseArgs(args: string[]): ParsedArgs {
	let command: string | undefined;
	let isInit = false;
	let cwd: string | undefined;
	let include: string[] | undefined;
	let exclude: string[] | undefined;
	let mode: CleanMode | undefined;
	let dryRun: boolean | undefined;
	let confirm: boolean | undefined;
	let verbose: boolean | undefined;
	let ignoreErrors: boolean | undefined;
	let protect: string[] | undefined;
	let strategy: CleanStrategy | undefined;
	let enabled: boolean | undefined;
	let force: boolean | undefined;
	let interactive: boolean | undefined;
	let report: CleanReportMode | undefined;
	let tags: string[] | undefined;
	let tagIntersect = false;
	let tools: string[] | undefined;
	let noPrompt = false;

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === undefined) continue;

		const next = args[i + 1];
		if (arg === "--cwd" && next !== undefined) {
			cwd = next;
			i++;
		} else if (arg.startsWith("--cwd=")) {
			cwd = arg.slice(6);
		} else if (arg === "--include" && next !== undefined) {
			include = parseCsv(next);
			i++;
		} else if (arg.startsWith("--include=")) {
			include = parseCsv(arg.slice(10));
		} else if (arg === "--exclude" && next !== undefined) {
			exclude = parseCsv(next);
			i++;
		} else if (arg.startsWith("--exclude=")) {
			exclude = parseCsv(arg.slice(10));
		} else if (arg === "--mode" && next !== undefined) {
			if (next === "delete" || next === "contentsOnly")
				mode = next;
			i++;
		} else if (arg.startsWith("--mode=")) {
			const candidate = arg.slice(7);
			if (
				candidate === "delete" ||
				candidate === "contentsOnly"
			)
				mode = candidate;
		} else if (arg.startsWith("--dry-run")) {
			dryRun = parseBooleanFlag(
				arg.includes("=") ?
					arg.split("=")[1]
				:	undefined,
			);
		} else if (arg.startsWith("--confirm")) {
			confirm = parseBooleanFlag(
				arg.includes("=") ?
					arg.split("=")[1]
				:	undefined,
			);
		} else if (arg.startsWith("--verbose")) {
			verbose = parseBooleanFlag(
				arg.includes("=") ?
					arg.split("=")[1]
				:	undefined,
			);
		} else if (arg.startsWith("--ignore-errors")) {
			ignoreErrors = parseBooleanFlag(
				arg.includes("=") ?
					arg.split("=")[1]
				:	undefined,
			);
		} else if (arg === "--protect" && next !== undefined) {
			protect = parseCsv(next);
			i++;
		} else if (arg.startsWith("--protect=")) {
			protect = parseCsv(arg.slice(10));
		} else if (arg === "--strategy" && next !== undefined) {
			if (next === "sequential" || next === "parallel")
				strategy = next;
			i++;
		} else if (arg.startsWith("--strategy=")) {
			const candidate = arg.slice(11);
			if (
				candidate === "sequential" ||
				candidate === "parallel"
			)
				strategy = candidate;
		} else if (arg.startsWith("--enabled")) {
			enabled = parseBooleanFlag(
				arg.includes("=") ?
					arg.split("=")[1]
				:	undefined,
			);
		} else if (arg.startsWith("--force")) {
			force = parseBooleanFlag(
				arg.includes("=") ?
					arg.split("=")[1]
				:	undefined,
			);
		} else if (arg.startsWith("--interactive")) {
			interactive = parseBooleanFlag(
				arg.includes("=") ?
					arg.split("=")[1]
				:	undefined,
			);
		} else if (arg === "--report" && next !== undefined) {
			if (
				next === "none" ||
				next === "summary" ||
				next === "json"
			)
				report = next;
			i++;
		} else if (arg.startsWith("--report=")) {
			const candidate = arg.slice(9);
			if (
				candidate === "none" ||
				candidate === "summary" ||
				candidate === "json"
			)
				report = candidate;
		} else if (arg === "--tags" && next !== undefined) {
			tags = parseCsv(next);
			i++;
		} else if (arg.startsWith("--tags=")) {
			tags = parseCsv(arg.slice(7));
		} else if (arg === "--tag-intersect") {
			tagIntersect = true;
		} else if (arg === "--tools" && next !== undefined) {
			tools = parseCsv(next);
			noPrompt = true;
			i++;
		} else if (arg.startsWith("--tools=")) {
			tools = parseCsv(arg.slice(8));
			noPrompt = true;
		} else if (arg === "--no-prompt") {
			noPrompt = true;
		} else if (!arg.startsWith("--")) {
			if (arg === "init") {
				isInit = true;
			} else {
				command = arg;
			}
		}
	}

	return {
		command,
		isInit,
		cwd,
		include,
		exclude,
		mode,
		dryRun,
		confirm,
		verbose,
		ignoreErrors,
		protect,
		strategy,
		enabled,
		force,
		interactive,
		report,
		tags,
		tagIntersect,
		tools,
		noPrompt,
	};
}

/**
 * Main CLI entry point.
 */
async function main(): Promise<void> {
	const args = process.argv.slice(2);
	const parsed = parseArgs(args);

	try {
		if (parsed.isInit) {
			await initClean({
				cwd: parsed.cwd,
				tools: parsed.tools,
				promptForBuiltIns: !parsed.noPrompt,
			});
		} else {
			const config = await loadConfig(parsed.cwd);
			const runOptions: RunOptions = {
				command: parsed.command,
				cwd: parsed.cwd,
				include: parsed.include,
				exclude: parsed.exclude,
				mode: parsed.mode,
				dryRun: parsed.dryRun,
				confirm: parsed.confirm,
				verbose: parsed.verbose,
				ignoreErrors: parsed.ignoreErrors,
				protect: parsed.protect,
				strategy: parsed.strategy,
				enabled: parsed.enabled,
				force: parsed.force,
				interactive: parsed.interactive,
				report: parsed.report,
				tags: parsed.tags,
				tagIntersect: parsed.tagIntersect,
			};
			await runClean(config, runOptions);
		}
	} catch (error) {
		console.error(
			"Error:",
			error instanceof Error ? error.message : error,
		);
		process.exit(1);
	}
}

main();
