import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { ephemeralStreamUrls, candidateFiles } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

/** Bytes per second from bitrate (kbps). FLAC uses ~900 kbps when bitrate is 0. */
const bytesPerSecondFromBitrate = (bitrate: number): number => {
	if (bitrate <= 0) return (900 * 1000) / 8; // ~112.5 KB/s for FLAC
	return (bitrate * 1000) / 8;
};

export const GET: RequestHandler = async ({ params, url, platform }) => {
	if (!platform) {
		return error(500, 'Platform not available');
	}

	const { token } = params;
	const db = getDb(platform);

	const startMs = url.searchParams.get('start');
	const durationMs = url.searchParams.get('duration');

	const streamUrl = await db
		.select()
		.from(ephemeralStreamUrls)
		.where(eq(ephemeralStreamUrls.token, token))
		.get();

	if (!streamUrl) {
		return error(404, 'Stream not found');
	}

	if (streamUrl.expiresAt < new Date()) {
		await db.delete(ephemeralStreamUrls).where(eq(ephemeralStreamUrls.token, token));
		return error(410, 'Stream expired');
	}

	const candidate = await db
		.select()
		.from(candidateFiles)
		.where(eq(candidateFiles.id, streamUrl.candidateFileId))
		.get();

	if (!candidate) {
		return error(404, 'Audio file not found');
	}

	const bucket = platform.env.AUDIO_BUCKET;
	const bytesPerSec = bytesPerSecondFromBitrate(candidate.bitrate);

	let range: { offset: number; length: number } | undefined;
	if (startMs != null && durationMs != null) {
		const start = Math.max(0, parseInt(startMs, 10) || 0);
		const duration = Math.max(0, parseInt(durationMs, 10) || 0);
		if (duration > 0) {
			const offset = Math.floor((start / 1000) * bytesPerSec);
			const length = Math.ceil((duration / 1000) * bytesPerSec);
			range = { offset, length };
		}
	}

	const object = range
		? await bucket.get(candidate.r2Key, { range })
		: await bucket.get(candidate.r2Key);

	if (!object || !object.body) {
		return error(404, 'Audio file not in storage');
	}

	const contentType = object.httpMetadata?.contentType ?? 'audio/mpeg';
	const size = object.size;

	const headers: Record<string, string> = {
		'Content-Type': contentType,
		'Cache-Control': 'no-store',
		'Accept-Ranges': 'bytes'
	};

	if (range && object.range) {
		headers['Content-Range'] = `bytes ${object.range.offset}-${object.range.offset + size - 1}/*`;
		headers['Content-Length'] = String(size);
		return new Response(object.body, { status: 206, headers });
	}

	headers['Content-Length'] = String(size);
	return new Response(object.body, { headers });
};
