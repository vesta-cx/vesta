import { json, error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import {
	answers,
	candidateFiles,
	ephemeralStreamUrls,
	SELECTED_OPTIONS,
	TRANSITION_MODES
} from '$lib/server/db/schema';
import { DEFAULT_SEGMENT_DURATION_MS } from '$lib/server/survey-config';
import type { RoundMode } from '$lib/server/game';
import type { RequestHandler } from './$types';

const ROUND_MODES: RoundMode[] = [
	'codec_compare',
	'bitrate_battle',
	'genre_trials',
	'tradeoff',
	'mixtape'
];

/** Short expiry for "you were listening to" playback token */
const PLAYBACK_TOKEN_EXPIRY_MIN = 2;

export const POST: RequestHandler = async ({ request, platform }) => {
	if (!platform) {
		return error(500, 'Platform not available');
	}

	const body = await request.json();
	const {
		tokenA,
		tokenB,
		tokenYwltA,
		tokenYwltB,
		selected,
		transitionMode,
		roundMode,
		startTime,
		segmentDuration,
		responseTime,
		deviceId,
		sessionId,
		playbackPositionMs
	} = body;

	// Validate required fields
	if (!tokenA || !tokenB || !selected || !transitionMode || !deviceId) {
		return error(400, 'Missing required fields');
	}

	if (!SELECTED_OPTIONS.includes(selected)) {
		return error(400, 'Invalid selection');
	}

	if (!TRANSITION_MODES.includes(transitionMode)) {
		return error(400, 'Invalid transition mode');
	}

	const db = getDb(platform);

	// Resolve tokens to candidate IDs
	const streamA = await db
		.select()
		.from(ephemeralStreamUrls)
		.where(eq(ephemeralStreamUrls.token, tokenA))
		.get();

	const streamB = await db
		.select()
		.from(ephemeralStreamUrls)
		.where(eq(ephemeralStreamUrls.token, tokenB))
		.get();

	if (!streamA || !streamB) {
		return error(410, 'Stream tokens expired or invalid');
	}

	const candidateAId = streamA.candidateFileId;
	const candidateBId = streamB.candidateFileId;

	const [candA, candB] = await Promise.all([
		db
			.select({ sourceFileId: candidateFiles.sourceFileId })
			.from(candidateFiles)
			.where(eq(candidateFiles.id, candidateAId))
			.get(),
		db
			.select({ sourceFileId: candidateFiles.sourceFileId })
			.from(candidateFiles)
			.where(eq(candidateFiles.id, candidateBId))
			.get()
	]);

	let pairingType: 'same_song' | 'different_song' | 'placebo' = 'same_song';
	if (candidateAId === candidateBId) {
		pairingType = 'placebo';
	} else if (candA && candB && candA.sourceFileId === candB.sourceFileId) {
		pairingType = 'same_song';
	} else {
		pairingType = 'different_song';
	}

	const validatedRoundMode: RoundMode | null =
		roundMode && ROUND_MODES.includes(roundMode) ? roundMode : null;

	const [answer] = await db
		.insert(answers)
		.values({
			deviceId,
			sessionId: sessionId ?? null,
			candidateAId,
			candidateBId,
			selected,
			pairingType,
			transitionMode,
			roundMode: validatedRoundMode,
			startTime: startTime ?? 0,
			segmentDuration: segmentDuration ?? DEFAULT_SEGMENT_DURATION_MS,
			responseTime: responseTime ?? null
		})
		.returning();

	// Clean up used tokens (comparison + YWLT opus_128)
	await db.delete(ephemeralStreamUrls).where(eq(ephemeralStreamUrls.token, tokenA));
	await db.delete(ephemeralStreamUrls).where(eq(ephemeralStreamUrls.token, tokenB));
	if (tokenYwltA) {
		await db.delete(ephemeralStreamUrls).where(eq(ephemeralStreamUrls.token, tokenYwltA));
	}
	if (tokenYwltB) {
		await db.delete(ephemeralStreamUrls).where(eq(ephemeralStreamUrls.token, tokenYwltB));
	}

	// Create playback token for opus_128 of selected source (lower quality to deter ripping)
	let playbackToken: string | null = null;
	const positionMs =
		typeof playbackPositionMs === 'number' && playbackPositionMs >= 0 ? playbackPositionMs : null;

	const selectedCandidateId = selected === 'a' ? candidateAId : candidateBId;
	const selectedCandidate = await db
		.select({ sourceFileId: candidateFiles.sourceFileId })
		.from(candidateFiles)
		.where(eq(candidateFiles.id, selectedCandidateId))
		.get();

	if (selectedCandidate) {
		const opus128 = await db
			.select({ id: candidateFiles.id })
			.from(candidateFiles)
			.where(
				and(
					eq(candidateFiles.sourceFileId, selectedCandidate.sourceFileId),
					eq(candidateFiles.codec, 'opus'),
					eq(candidateFiles.bitrate, 128)
				)
			)
			.get();

		if (opus128) {
			const expiresAt = new Date(Date.now() + PLAYBACK_TOKEN_EXPIRY_MIN * 60 * 1000);
			const [row] = await db
				.insert(ephemeralStreamUrls)
				.values({ candidateFileId: opus128.id, expiresAt })
				.returning();
			playbackToken = row?.token ?? null;
		}
	}

	return json({
		id: answer?.id,
		success: true,
		playbackToken,
		playbackPositionMs: positionMs ?? 0
	});
};
