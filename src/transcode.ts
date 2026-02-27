/** @format */

import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import type { StorageProvider } from "@vesta-cx/storage";

export type Codec = "flac" | "opus" | "mp3" | "aac";

export interface TranscodeTarget {
	codec: Codec;
	bitrate: number;
	/** Optional target output prefix. Before last '/' is key path; last segment prefixes filename. */
	outputPrefix?: string;
	/** Optional target-specific filename suffix. Default: "_<codec>_<bitrate>". */
	outputSuffix?: string;
	/** If true and codec supports it, also produce HLS (aac, mp3) or DASH (opus) segments alongside the whole file. */
	chunks?: boolean;
}

/** Controls output file and path naming conventions. */
export interface TranscodeNaming {
	/** Filename pattern for candidates. Placeholders: {basename}, {prefix}, {suffix}, {codec}, {bitrate}, {ext}. Default: "{basename}{suffix}.{ext}" */
	pattern?: string;
	/** Include sourceId in candidate path. When true (default): candidates/{sourceId}/{filename}; when false: candidates/{filename}. */
	includeSourceIdInPath?: boolean;
}

/** Chunked (HLS/DASH) output configuration. */
export interface TranscodeChunks {
	/** Segment duration in milliseconds. Default: 6000 (6 sec). */
	segmentDurationMs?: number;
}

export interface TranscodeConfig {
	targets: TranscodeTarget[];
	/** Base name for output files (used in object keys). */
	filename: string;
	/** Path prefix in bucket (e.g. "sources", "audio/2025", or ""). */
	uploadPrefix: string;
	/** Naming conventions for output paths and filenames. */
	naming?: TranscodeNaming;
	/** Chunked output settings. Use TranscodeTarget.chunks to enable per-target. */
	chunks?: TranscodeChunks;
	/** Client-provided source file ID. If set, used as source.id in webhook; otherwise generated. */
	sourceFileId?: string;
}

export interface WebhookSource {
	id: string;
	filename: string;
	r2Key: string;
	uploadedAt: number;
	duration: number;
}

/** Chunk metadata when TranscodeTarget.chunks is true. */
export interface WebhookCandidateChunks {
	/** R2 key prefix for segments (e.g. "candidates/abc/track_aac_128_hls/"). Segments: {prefix}0.m4s, {prefix}1.m4s, ... */
	r2KeyHls: string;
	/** Nominal segment duration in ms (from config.chunks.segmentDurationMs). */
	segmentDurationMs: number;
	/** Actual duration of each segment in ms. Last segment may be shorter. */
	segmentDurations: number[];
}

export interface WebhookCandidate {
	id: string;
	r2Key: string;
	codec: Codec;
	bitrate: number;
	sourceFileId: string;
	/** Present when chunks were produced. Includes duration per chunk. */
	chunks?: WebhookCandidateChunks;
}

export interface TranscodeResult {
	sourceFileId: string;
	candidateIds: string[];
	sourceR2Key: string;
	source: WebhookSource;
	candidates: WebhookCandidate[];
}

const CODEC_EXTS: Record<Codec, string> = {
	flac: "flac",
	opus: "ogg",
	mp3: "mp3",
	aac: "m4a",
};

const probeDuration = async (inputPath: string): Promise<number> => {
	return new Promise((resolve, reject) => {
		const proc = spawn("ffprobe", [
			"-v",
			"error",
			"-show_entries",
			"format=duration",
			"-of",
			"csv=p=0",
			inputPath,
		]);
		let out = "";
		let err = "";
		proc.stdout?.on("data", (d) => (out += d.toString()));
		proc.stderr?.on("data", (d) => (err += d.toString()));
		proc.on("close", (code) => {
			if (code !== 0) {
				reject(
					new Error(
						`ffprobe failed: ${err || out}`,
					),
				);
				return;
			}
			const sec = parseFloat(out.trim());
			resolve(
				Number.isFinite(sec) ?
					Math.round(sec * 1000)
				:	0,
			);
		});
	});
};

const runFfmpeg = async (
	inputPath: string,
	outputPath: string,
	codec: Codec,
	bitrate: number,
): Promise<void> => {
	const base = [
		"-y",
		"-i",
		inputPath,
		"-map",
		"0:a",
		"-map_metadata",
		"-1",
	];
	let extra: string[];
	switch (codec) {
		case "flac":
			extra = ["-c:a", "flac"];
			break;
		case "opus":
			extra = ["-c:a", "libopus", "-b:a", `${bitrate}k`];
			break;
		case "mp3":
			extra = [
				"-c:a",
				"libmp3lame",
				"-b:a",
				`${bitrate}k`,
				"-id3v2_version",
				"3",
			];
			break;
		case "aac":
			extra = [
				"-c:a",
				"aac",
				"-b:a",
				`${bitrate}k`,
				"-movflags",
				"+faststart",
			];
			break;
		default:
			throw new Error(`Unsupported codec: ${codec}`);
	}

	return new Promise((resolve, reject) => {
		const proc = spawn("ffmpeg", [...base, ...extra, outputPath]);
		let err = "";
		proc.stderr?.on("data", (d) => (err += d.toString()));
		proc.on("close", (code) => {
			if (code !== 0)
				reject(
					new Error(
						`ffmpeg failed (${code}): ${err}`,
					),
				);
			else resolve();
		});
	});
};

const slugify = (s: string): string =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_|_$/g, "") || "audio";

const joinPrefix = (prefix: string, ...parts: string[]): string => {
	const base = prefix ? `${prefix.replace(/\/$/, "")}/` : "";
	return base + parts.filter(Boolean).join("/");
};

export const resolveTargetOutput = (
	target: Pick<TranscodeTarget, "codec" | "bitrate" | "outputPrefix" | "outputSuffix">,
): { targetPrefix: string; filenamePrefix: string; suffix: string } => {
	const raw = (target.outputPrefix ?? `${target.codec}/`).trim();
	const cleaned = raw.replace(/^\/+/, "").replace(/\/+$/, "");
	const hadTrailingSlash = /\/\s*$/.test(raw);
	let targetPrefix = "";
	let filenamePrefix = "";
	if (!cleaned) {
		targetPrefix = `${target.codec}/`;
	} else if (hadTrailingSlash) {
		targetPrefix = `${cleaned}/`;
	} else {
		const separator = cleaned.lastIndexOf("/");
		targetPrefix =
			separator >= 0 ? `${cleaned.slice(0, separator + 1)}` : "";
		filenamePrefix =
			separator >= 0 ? cleaned.slice(separator + 1) : cleaned;
	}
	const suffix =
		target.outputSuffix?.trim().length ?
			target.outputSuffix.trim()
		:	`_${target.codec}_${target.bitrate}`;
	return { targetPrefix, filenamePrefix, suffix };
};

const uploadFile = async (
	storage: StorageProvider,
	key: string,
	filePath: string,
	contentType: string,
): Promise<void> => {
	await storage.put(
		key,
		Readable.toWeb(fs.createReadStream(filePath)),
		contentType,
	);
};

export const transcode = async (
	inputPath: string,
	config: TranscodeConfig,
	storage: StorageProvider,
): Promise<TranscodeResult> => {
	const { targets, filename, uploadPrefix } = config;
	if (targets.length === 0) throw new Error("No targets specified");

	const sanitized = slugify(
		filename || path.basename(inputPath, path.extname(inputPath)),
	);
	const durationMs = await probeDuration(inputPath);
	const sourceId = config.sourceFileId ?? randomUUID();
	const shortId = sourceId.slice(0, 8);
	const sourceR2Key = joinPrefix(
		uploadPrefix,
		"sources",
		`${sanitized}_${shortId}.flac`,
	);

	const flacTarget = targets.find((t) => t.codec === "flac");
	const sourceTarget = flacTarget ?? targets[0]!;
	const sourceExt = CODEC_EXTS[sourceTarget.codec];
	const sourceTmp = path.join(
		path.dirname(inputPath),
		`source_${sourceId}.${sourceExt}`,
	);
	try {
		await runFfmpeg(
			inputPath,
			sourceTmp,
			sourceTarget.codec,
			sourceTarget.bitrate,
		);
		await uploadFile(
			storage,
			sourceR2Key,
			sourceTmp,
			`audio/${sourceExt === "ogg" ? "ogg" : sourceExt}`,
		);
	} finally {
		try {
			fs.unlinkSync(sourceTmp);
		} catch {
			// ignore
		}
	}

	const uploadedAt = Math.floor(Date.now() / 1000);
	const source: WebhookSource = {
		id: sourceId,
		filename: sanitized,
		r2Key: sourceR2Key,
		uploadedAt,
		duration: durationMs,
	};

	const candidateIds: string[] = [];
	const candidates: WebhookCandidate[] = [];

	for (const t of targets) {
		if (
			t.codec === sourceTarget.codec &&
			t.bitrate === sourceTarget.bitrate
		) {
			const candidateId = randomUUID();
			candidates.push({
				id: candidateId,
				r2Key: sourceR2Key,
				codec: t.codec,
				bitrate: t.bitrate,
				sourceFileId: sourceId,
			});
			candidateIds.push(candidateId);
			continue;
		}
		const candidateId = randomUUID();
		const ext = CODEC_EXTS[t.codec];
		const resolved = resolveTargetOutput(t);
		const pattern =
			config.naming?.pattern ??
			"{basename}{suffix}.{ext}";
		const candidateFilename = pattern
			.replace("{basename}", `${resolved.filenamePrefix}${sanitized}`)
			.replace("{prefix}", resolved.filenamePrefix)
			.replace("{suffix}", resolved.suffix)
			.replace("{codec}", t.codec)
			.replace("{bitrate}", String(t.bitrate))
			.replace("{ext}", ext);
		const includeSourceId =
			config.naming?.includeSourceIdInPath !== false;
		const candidatePathParts =
			includeSourceId ?
				["candidates", sourceId, resolved.targetPrefix, candidateFilename]
			:	["candidates", resolved.targetPrefix, candidateFilename];
		const candidateR2Key = joinPrefix(
			uploadPrefix,
			...candidatePathParts,
		);
		const tmpPath = path.join(
			path.dirname(inputPath),
			`cand_${candidateId}.${ext}`,
		);
		try {
			await runFfmpeg(inputPath, tmpPath, t.codec, t.bitrate);
			await uploadFile(
				storage,
				candidateR2Key,
				tmpPath,
				`audio/${ext === "ogg" ? "ogg" : ext}`,
			);
			candidates.push({
				id: candidateId,
				r2Key: candidateR2Key,
				codec: t.codec,
				bitrate: t.bitrate,
				sourceFileId: sourceId,
			});
			candidateIds.push(candidateId);
		} finally {
			try {
				fs.unlinkSync(tmpPath);
			} catch {
				// ignore
			}
		}
	}

	return {
		sourceFileId: sourceId,
		candidateIds,
		sourceR2Key,
		source,
		candidates,
	};
};
