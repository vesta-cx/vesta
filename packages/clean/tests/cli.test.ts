/** @format */

import { describe, expect, it } from "vitest";
import { parseArgs, validateParsedArgs } from "../src/cli.js";

describe("parseArgs", () => {
	it("parses config path via -c/--config", () => {
		expect(parseArgs(["-c", "custom.cleanrc.json"]).config).toBe(
			"custom.cleanrc.json",
		);
		expect(
			parseArgs(["--config", "custom.cleanrc.json"]).config,
		).toBe("custom.cleanrc.json");
		expect(parseArgs(["-c=custom.cleanrc.json"]).config).toBe(
			"custom.cleanrc.json",
		);
		expect(parseArgs(["--config=custom.cleanrc.json"]).config).toBe(
			"custom.cleanrc.json",
		);
	});

	it("throws when required value flags are missing", () => {
		expect(() => parseArgs(["-c"])).toThrow("-c requires a value.");
		expect(() => parseArgs(["--config"])).toThrow(
			"--config requires a value.",
		);
		expect(() => parseArgs(["--include"])).toThrow(
			"--include requires a value.",
		);
		expect(() => parseArgs(["--exclude"])).toThrow(
			"--exclude requires a value.",
		);
		expect(() => parseArgs(["--tags"])).toThrow(
			"--tags requires a value.",
		);
		expect(() => parseArgs(["--tools"])).toThrow(
			"--tools requires a value.",
		);
	});

	it("throws when required value flags receive another flag token", () => {
		expect(() => parseArgs(["--include", "--dry-run"])).toThrow(
			"--include requires a value.",
		);
		expect(() => parseArgs(["--config", "--cwd=foo"])).toThrow(
			"--config requires a value.",
		);
	});

	it("throws on invalid boolean values", () => {
		expect(() => parseArgs(["--dry-run=maybe"])).toThrow(
			'Invalid boolean value for --dry-run: "maybe". Use true/false.',
		);
		expect(() => parseArgs(["--force=nah"])).toThrow(
			'Invalid boolean value for --force: "nah". Use true/false.',
		);
		expect(() => parseArgs(["--merge=asdf"])).toThrow(
			'Invalid boolean value for --merge: "asdf". Use true/false.',
		);
	});

	it("throws on invalid enum values", () => {
		expect(() => parseArgs(["--mode=random"])).toThrow(
			'Invalid value for --mode: "random". Use delete|contentsOnly.',
		);
		expect(() => parseArgs(["--strategy=invalid"])).toThrow(
			'Invalid value for --strategy: "invalid". Use sequential|parallel.',
		);
		expect(() => parseArgs(["--report=oops"])).toThrow(
			'Invalid value for --report: "oops". Use none|summary|json.',
		);
	});

	it("supports boolean values for --tag-intersect and --no-prompt", () => {
		expect(parseArgs(["--tag-intersect"]).tagIntersect).toBe(true);
		expect(parseArgs(["--tag-intersect=false"]).tagIntersect).toBe(
			false,
		);
		expect(parseArgs(["--no-prompt"]).noPrompt).toBe(true);
		expect(parseArgs(["--no-prompt=false"]).noPrompt).toBe(false);
	});

	it("validates conflicting confirmation flags", () => {
		expect(() =>
			validateParsedArgs(
				parseArgs(["--confirm=true", "--force=true"]),
			),
		).toThrow(
			"Cannot use --confirm=true with --force=true. Use one or the other.",
		);
		expect(() =>
			validateParsedArgs(
				parseArgs([
					"--confirm=true",
					"--interactive=false",
				]),
			),
		).toThrow(
			"Cannot use --confirm=true with --interactive=false. Use --interactive=true or --force=true.",
		);
	});
});
