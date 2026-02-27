/** @format */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { EventEmitter } from "node:events";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StorageProvider } from "@vesta-cx/storage";

vi.mock("node:child_process", () => {
	const spawn = vi.fn((command: string, args: string[]) => {
		const proc = new EventEmitter() as EventEmitter & {
			stdout?: EventEmitter;
			stderr?: EventEmitter;
		};
		proc.stdout = new EventEmitter();
		proc.stderr = new EventEmitter();

		setImmediate(() => {
			if (command === "ffprobe") {
				proc.stdout?.emit("data", Buffer.from("12.34\n"));
				proc.emit("close", 0);
				return;
			}

			if (command === "ffmpeg") {
				const outputPath = args[args.length - 1]!;
				fs.writeFileSync(outputPath, Buffer.from("mock-audio"));
				proc.emit("close", 0);
				return;
			}

			proc.emit("close", 1);
		});

		return proc;
	});

	return { spawn };
});

import { transcode } from "./transcode.js";

const mkStorage = () => {
	const keys: string[] = [];
	const storage: StorageProvider = {
		put: async (key) => {
			keys.push(key);
		},
		get: async () => null,
		getSignedUrl: async () => "",
		delete: async () => {},
		list: async () => ({ objects: [], truncated: false }),
	};
	return { storage, keys };
};

afterEach(() => {
	vi.clearAllMocks();
});

describe("transcode", () => {
	it("uploads source and candidates with expected key layout", async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "euterpe-transcode-"));
		const inputPath = path.join(tempDir, "input.flac");
		fs.writeFileSync(inputPath, Buffer.from("input"));

		const { storage, keys } = mkStorage();
		const result = await transcode(
			inputPath,
			{
				filename: "My Song",
				uploadPrefix: "audio/2026",
				sourceFileId: "source-12345678",
				targets: [
					{ codec: "flac", bitrate: 320 },
					{ codec: "opus", bitrate: 128, outputPrefix: "mobile/opus_" },
				],
			},
			storage,
		);

		expect(result.sourceFileId).toBe("source-12345678");
		expect(result.source.r2Key).toContain("audio/2026/sources/");
		expect(result.candidates.length).toBe(2);
		expect(keys.some((key) => key.includes("audio/2026/sources/"))).toBe(true);
		expect(
			keys.some((key) => key.includes("audio/2026/candidates/source-12345678/mobile/")),
		).toBe(true);
		expect(
			keys.some((key) => key.includes("opus_my_song_opus_128.ogg")),
		).toBe(true);
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	it("throws when no targets are provided", async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "euterpe-transcode-"));
		const inputPath = path.join(tempDir, "input.flac");
		fs.writeFileSync(inputPath, Buffer.from("input"));
		const { storage } = mkStorage();

		await expect(
			transcode(
				inputPath,
				{
					filename: "empty",
					uploadPrefix: "",
					targets: [],
				},
				storage,
			),
		).rejects.toThrow("No targets specified");
		fs.rmSync(tempDir, { recursive: true, force: true });
	});
});
