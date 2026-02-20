import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import type { StorageProvider } from '@vesta-cx/storage';

export type Codec = 'flac' | 'opus' | 'mp3' | 'aac';

export interface TranscodeTarget {
	codec: Codec;
	bitrate: number;
}

import type { StorageConfig } from './storage/factory.js';

export interface TranscodeConfig {
	targets: TranscodeTarget[];
	/** Base name for output files (used in object keys). */
	filename: string;
	/** Path prefix in bucket (e.g. "sources", "audio/2025", or ""). */
	uploadPrefix: string;
	webhookUrl?: string;
	/** Client-provided source file ID. If set, used as source.id in webhook; otherwise generated. */
	sourceFileId?: string;
	storage: StorageConfig;
}

export interface WebhookSource {
	id: string;
	filename: string;
	r2Key: string;
	uploadedAt: number;
	duration: number;
}

export interface WebhookCandidate {
	id: string;
	r2Key: string;
	codec: Codec;
	bitrate: number;
	sourceFileId: string;
}

export interface TranscodeResult {
	sourceFileId: string;
	candidateIds: string[];
	sourceR2Key: string;
	source: WebhookSource;
	candidates: WebhookCandidate[];
}

const CODEC_EXTS: Record<Codec, string> = {
	flac: 'flac',
	opus: 'ogg',
	mp3: 'mp3',
	aac: 'm4a'
};

const probeDuration = async (inputPath: string): Promise<number> => {
	return new Promise((resolve, reject) => {
		const proc = spawn('ffprobe', [
			'-v',
			'error',
			'-show_entries',
			'format=duration',
			'-of',
			'csv=p=0',
			inputPath
		]);
		let out = '';
		let err = '';
		proc.stdout?.on('data', (d) => (out += d.toString()));
		proc.stderr?.on('data', (d) => (err += d.toString()));
		proc.on('close', (code) => {
			if (code !== 0) {
				reject(new Error(`ffprobe failed: ${err || out}`));
				return;
			}
			const sec = parseFloat(out.trim());
			resolve(Number.isFinite(sec) ? Math.round(sec * 1000) : 0);
		});
	});
};

const runFfmpeg = async (
	inputPath: string,
	outputPath: string,
	codec: Codec,
	bitrate: number
): Promise<void> => {
	const base = ['-y', '-i', inputPath, '-map', '0:a', '-map_metadata', '-1'];
	let extra: string[];
	switch (codec) {
		case 'flac':
			extra = ['-c:a', 'flac'];
			break;
		case 'opus':
			extra = ['-c:a', 'libopus', '-b:a', `${bitrate}k`];
			break;
		case 'mp3':
			extra = ['-c:a', 'libmp3lame', '-b:a', `${bitrate}k`, '-id3v2_version', '3'];
			break;
		case 'aac':
			extra = ['-c:a', 'aac', '-b:a', `${bitrate}k`, '-movflags', '+faststart'];
			break;
		default:
			throw new Error(`Unsupported codec: ${codec}`);
	}

	return new Promise((resolve, reject) => {
		const proc = spawn('ffmpeg', [...base, ...extra, outputPath]);
		let err = '';
		proc.stderr?.on('data', (d) => (err += d.toString()));
		proc.on('close', (code) => {
			if (code !== 0) reject(new Error(`ffmpeg failed (${code}): ${err}`));
			else resolve();
		});
	});
};

const slugify = (s: string): string =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_|_$/g, '') || 'audio';

const joinPrefix = (prefix: string, ...parts: string[]): string => {
	const base = prefix ? `${prefix.replace(/\/$/, '')}/` : '';
	return base + parts.filter(Boolean).join('/');
};

export const transcode = async (
	inputPath: string,
	config: TranscodeConfig,
	storage: StorageProvider
): Promise<TranscodeResult> => {
	const { targets, filename, uploadPrefix } = config;
	if (targets.length === 0) throw new Error('No targets specified');

	const sanitized = slugify(filename || path.basename(inputPath, path.extname(inputPath)));
	const durationMs = await probeDuration(inputPath);
	const sourceId = config.sourceFileId ?? randomUUID();
	const shortId = sourceId.slice(0, 8);
	const sourceR2Key = joinPrefix(uploadPrefix, 'sources', `${sanitized}_${shortId}.flac`);

	const flacTarget = targets.find((t) => t.codec === 'flac');
	const sourceTarget = flacTarget ?? targets[0]!;
	const sourceExt = CODEC_EXTS[sourceTarget.codec];
	const sourceTmp = path.join(path.dirname(inputPath), `source_${sourceId}.${sourceExt}`);
	try {
		await runFfmpeg(inputPath, sourceTmp, sourceTarget.codec, sourceTarget.bitrate);
		const buf = fs.readFileSync(sourceTmp);
		await storage.put(
			sourceR2Key,
			buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
			`audio/${sourceExt === 'ogg' ? 'ogg' : sourceExt}`
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
		duration: durationMs
	};

	const candidateIds: string[] = [];
	const candidates: WebhookCandidate[] = [];

	for (const t of targets) {
		if (t.codec === sourceTarget.codec && t.bitrate === sourceTarget.bitrate) {
			const candidateId = randomUUID();
			candidates.push({
				id: candidateId,
				r2Key: sourceR2Key,
				codec: t.codec,
				bitrate: t.bitrate,
				sourceFileId: sourceId
			});
			candidateIds.push(candidateId);
			continue;
		}
		const candidateId = randomUUID();
		const ext = CODEC_EXTS[t.codec];
		const candidateR2Key = joinPrefix(
			uploadPrefix,
			'candidates',
			sourceId,
			`${sanitized}_${t.codec}_${t.bitrate}.${ext}`
		);
		const tmpPath = path.join(path.dirname(inputPath), `cand_${candidateId}.${ext}`);
		try {
			await runFfmpeg(inputPath, tmpPath, t.codec, t.bitrate);
			const buf = fs.readFileSync(tmpPath);
			await storage.put(
				candidateR2Key,
				buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
				`audio/${ext === 'ogg' ? 'ogg' : ext}`
			);
			candidates.push({
				id: candidateId,
				r2Key: candidateR2Key,
				codec: t.codec,
				bitrate: t.bitrate,
				sourceFileId: sourceId
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

	return { sourceFileId: sourceId, candidateIds, sourceR2Key, source, candidates };
};
