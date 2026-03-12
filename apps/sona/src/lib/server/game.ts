import { and, eq, isNotNull } from 'drizzle-orm';
import type { Database } from './db';
import {
	sourceFiles,
	candidateFiles,
	ephemeralStreamUrls,
	qualityOptions,
	type TransitionMode,
	TRANSITION_MODES
} from './db/schema';
import {
	getPairingWeights,
	getPlaceboProbability,
	getPermutationWeights,
	getSegmentDuration,
	getTransitionWeights,
	DEFAULT_SEGMENT_DURATION_MS
} from './survey-config';

/** round_mode returned by generateRound. Mixtape until mode-specific generators exist. */
export type RoundMode =
	| 'codec_compare'
	| 'bitrate_battle'
	| 'genre_trials'
	| 'tradeoff'
	| 'mixtape';

/** Default segment duration in ms; used when config is unavailable (e.g. tests) */
export const SEGMENT_DURATION_MS = DEFAULT_SEGMENT_DURATION_MS;

/** FLAC uses 1411 kbps (PCM) for gap calculations; other codecs use actual bitrate. */
export const effectiveBitrate = (codec: string, bitrate: number): number =>
	codec === 'flac' || bitrate === 0 ? 1411 : bitrate;

const weightedRandom = <T extends string>(weights: Record<T, number>): T => {
	const rand = Math.random();
	let cumulative = 0;
	for (const [key, weight] of Object.entries(weights) as [T, number][]) {
		cumulative += weight;
		if (rand <= cumulative) return key;
	}
	return Object.keys(weights)[0] as T;
};

const randomElement = <T>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];

/** Pick count distinct items by weighted sampling. Uses copies to avoid mutating caller arrays. */
const weightedRandomWithoutReplacement = <T>(items: T[], weights: number[], count: number): T[] => {
	if (items.length < count || weights.length !== items.length) return [];
	const result: T[] = [];
	const copy = [...items];
	const w = [...weights];
	let n = copy.length;

	for (let i = 0; i < count; i++) {
		const total = w.slice(0, n).reduce((a, b) => a + b, 0);
		if (total <= 0) break;
		let r = Math.random() * total;
		for (let j = 0; j < n; j++) {
			r -= w[j];
			if (r <= 0) {
				result.push(copy[j]);
				[copy[j], copy[n - 1]] = [copy[n - 1], copy[j]];
				[w[j], w[n - 1]] = [w[n - 1], w[j]];
				n--;
				break;
			}
		}
	}
	return result;
};

export interface ComparisonRound {
	tokenA: string;
	tokenB: string;
	/** Ephemeral tokens for opus_128 of each source (YWLT preload). Null if opus_128 not available. */
	tokenYwltA: string | null;
	tokenYwltB: string | null;
	transitionMode: TransitionMode;
	roundMode: RoundMode;
	startTime: number;
	duration: number;
	/** Song metadata for "you were listening to" display. Same for same_song/placebo. */
	labelA: {
		title: string;
		artist: string | null;
		featuredArtists: string | null;
		remixArtists: string | null;
		streamUrl: string | null;
	};
	labelB: {
		title: string;
		artist: string | null;
		featuredArtists: string | null;
		remixArtists: string | null;
		streamUrl: string | null;
	};
}

export type EnabledTransitionModes = TransitionMode[] | null;
/** same_song and/or different_song. Placebo is controlled by admin config, not user. */
export type EnabledPairingTypes = ('same_song' | 'different_song')[] | null;

const PAIRING_POOL = ['same_song', 'different_song'] as const;
type PairingChoice = (typeof PAIRING_POOL)[number];

const getWeightsForPool = <T extends { codec: string; bitrate: number }>(
	items: T[],
	permWeights: Record<string, number>,
	defaultWeight = 1
): number[] =>
	items.map((c) => {
		const k = `${c.codec}_${c.bitrate}`;
		return permWeights[k] ?? defaultWeight;
	});

export const generateRound = async (
	db: Database,
	enabledModes: EnabledTransitionModes = null,
	enabledPairing: EnabledPairingTypes = null
): Promise<ComparisonRound | null> => {
	const approvedSources = await db
		.select()
		.from(sourceFiles)
		.where(
			and(
				isNotNull(sourceFiles.approvedAt),
				isNotNull(sourceFiles.r2Key),
				isNotNull(sourceFiles.duration)
			)
		)
		.all();

	if (approvedSources.length === 0) return null;

	const enabledOptions = await db
		.select()
		.from(qualityOptions)
		.where(eq(qualityOptions.enabled, true))
		.all();

	if (enabledOptions.length === 0) return null;

	const enabledKeys = new Set(enabledOptions.map((o) => `${o.codec}_${o.bitrate}`));
	const filterByEnabled = <T extends { codec: string; bitrate: number }>(arr: T[]): T[] =>
		arr.filter((c) => enabledKeys.has(`${c.codec}_${c.bitrate}`));

	let pairingPool: readonly PairingChoice[] = [...PAIRING_POOL];
	if (enabledPairing && enabledPairing.length > 0) {
		pairingPool = PAIRING_POOL.filter((p) => enabledPairing.includes(p));
	}
	if (pairingPool.length === 0) pairingPool = [...PAIRING_POOL];

	const [pairingWeights, placeboProb, permWeights, transitionWeights, segmentDurationMs] =
		await Promise.all([
			getPairingWeights(db),
			getPlaceboProbability(db),
			getPermutationWeights(db),
			getTransitionWeights(db),
			getSegmentDuration(db)
		]);

	const totalPair = pairingPool.reduce((sum, p) => sum + (pairingWeights[p] ?? 1), 0);
	const pairNorm = Object.fromEntries(
		pairingPool.map((p) => [p, (pairingWeights[p] ?? 1) / totalPair])
	) as Record<PairingChoice, number>;
	const pairingType = weightedRandom(pairNorm);

	let transitionPool: readonly TransitionMode[] =
		pairingType === 'different_song'
			? (['gap_pause_resume'] as const)
			: ['gapless', 'gap_continue', 'gap_restart'];
	if (enabledModes && enabledModes.length > 0) {
		transitionPool = transitionPool.filter((m) => enabledModes.includes(m));
	}
	if (transitionPool.length === 0) {
		transitionPool =
			pairingType === 'different_song'
				? ['gap_pause_resume']
				: ['gapless', 'gap_continue', 'gap_restart'];
	}
	const transWeightsNorm = transitionPool.reduce((sum, m) => sum + (transitionWeights[m] ?? 1), 0);
	const transProbs = Object.fromEntries(
		transitionPool.map((m) => [m, (transitionWeights[m] ?? 1) / transWeightsNorm])
	) as Record<TransitionMode, number>;
	const transitionMode = weightedRandom(transProbs);

	let candidateA: { id: string; sourceFileId: string } | undefined;
	let candidateB: { id: string; sourceFileId: string } | undefined;
	let sourceDuration: number;

	if (pairingType === 'same_song') {
		const source = randomElement(approvedSources);
		if (!source) return null;
		sourceDuration = source.duration;

		const rawCandidates = await db
			.select({
				id: candidateFiles.id,
				sourceFileId: candidateFiles.sourceFileId,
				codec: candidateFiles.codec,
				bitrate: candidateFiles.bitrate
			})
			.from(candidateFiles)
			.where(eq(candidateFiles.sourceFileId, source.id))
			.all();

		const candidates = filterByEnabled(rawCandidates);
		if (candidates.length === 0) return null;

		const isPlacebo = Math.random() < placeboProb;
		const weights = getWeightsForPool(candidates, permWeights);

		if (isPlacebo) {
			const totalW = weights.reduce((a, b) => a + b, 0);
			const probs = weights.map((w) => w / totalW);
			let r = Math.random();
			for (let i = 0; i < candidates.length; i++) {
				r -= probs[i];
				if (r <= 0) {
					candidateA = candidates[i];
					candidateB = candidates[i];
					break;
				}
			}
			if (!candidateA) {
				candidateA = candidates[0];
				candidateB = candidates[0];
			}
		} else {
			if (candidates.length < 2) return null;
			const [a, b] = weightedRandomWithoutReplacement([...candidates], [...weights], 2);
			candidateA = a;
			candidateB = b;
		}
	} else {
		if (approvedSources.length < 2) return null;

		const sourceA = randomElement(approvedSources);
		const sourceB = randomElement(approvedSources.filter((s) => s.id !== sourceA?.id));
		if (!sourceA || !sourceB) return null;

		sourceDuration = Math.min(sourceA.duration, sourceB.duration);

		const [rawA, rawB] = await Promise.all([
			db
				.select({
					id: candidateFiles.id,
					sourceFileId: candidateFiles.sourceFileId,
					codec: candidateFiles.codec,
					bitrate: candidateFiles.bitrate
				})
				.from(candidateFiles)
				.where(eq(candidateFiles.sourceFileId, sourceA.id))
				.all(),
			db
				.select({
					id: candidateFiles.id,
					sourceFileId: candidateFiles.sourceFileId,
					codec: candidateFiles.codec,
					bitrate: candidateFiles.bitrate
				})
				.from(candidateFiles)
				.where(eq(candidateFiles.sourceFileId, sourceB.id))
				.all()
		]);

		const candidatesA = filterByEnabled(rawA);
		const candidatesB = filterByEnabled(rawB);
		if (candidatesA.length === 0 || candidatesB.length === 0) return null;

		const weightsA = getWeightsForPool(candidatesA, permWeights);
		const weightsB = getWeightsForPool(candidatesB, permWeights);
		const totalA = weightsA.reduce((a, b) => a + b, 0);
		const totalB = weightsB.reduce((a, b) => a + b, 0);
		const probsA =
			totalA > 0 ? weightsA.map((w) => w / totalA) : weightsA.map(() => 1 / weightsA.length);
		const probsB =
			totalB > 0 ? weightsB.map((w) => w / totalB) : weightsB.map(() => 1 / weightsB.length);

		let r = Math.random();
		for (let i = 0; i < candidatesA.length; i++) {
			r -= probsA[i];
			if (r <= 0) {
				candidateA = candidatesA[i];
				break;
			}
		}
		if (!candidateA) candidateA = candidatesA[0];

		r = Math.random();
		for (let i = 0; i < candidatesB.length; i++) {
			r -= probsB[i];
			if (r <= 0) {
				candidateB = candidatesB[i];
				break;
			}
		}
		if (!candidateB) candidateB = candidatesB[0];
	}

	if (!candidateA || !candidateB) return null;

	// Randomize which candidate is A vs B to avoid position bias
	if (candidateA.id !== candidateB.id && Math.random() < 0.5) {
		[candidateA, candidateB] = [candidateB, candidateA];
	}

	// Generate start time clamped to valid range
	const maxStart = Math.max(0, sourceDuration - segmentDurationMs);
	const startTime = Math.floor(Math.random() * maxStart);

	// Create ephemeral stream URLs (10-min expiry)
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

	const [tokenARow] = await db
		.insert(ephemeralStreamUrls)
		.values({ candidateFileId: candidateA.id, expiresAt })
		.returning();

	const [tokenBRow] = await db
		.insert(ephemeralStreamUrls)
		.values({ candidateFileId: candidateB.id, expiresAt })
		.returning();

	if (!tokenARow || !tokenBRow) {
		return null;
	}

	// Create opus_128 tokens for YWLT preload (lower quality to deter ripping)
	const ywltExpiresAt = new Date(Date.now() + 2 * 60 * 1000);
	const [opus128A, opus128B] = await Promise.all([
		db
			.select({ id: candidateFiles.id })
			.from(candidateFiles)
			.where(
				and(
					eq(candidateFiles.sourceFileId, candidateA.sourceFileId),
					eq(candidateFiles.codec, 'opus'),
					eq(candidateFiles.bitrate, 128)
				)
			)
			.get(),
		db
			.select({ id: candidateFiles.id })
			.from(candidateFiles)
			.where(
				and(
					eq(candidateFiles.sourceFileId, candidateB.sourceFileId),
					eq(candidateFiles.codec, 'opus'),
					eq(candidateFiles.bitrate, 128)
				)
			)
			.get()
	]);

	let tokenYwltA: string | null = null;
	let tokenYwltB: string | null = null;
	if (opus128A) {
		const [row] = await db
			.insert(ephemeralStreamUrls)
			.values({ candidateFileId: opus128A.id, expiresAt: ywltExpiresAt })
			.returning();
		tokenYwltA = row?.token ?? null;
	}
	if (opus128B) {
		const [row] = await db
			.insert(ephemeralStreamUrls)
			.values({ candidateFileId: opus128B.id, expiresAt: ywltExpiresAt })
			.returning();
		tokenYwltB = row?.token ?? null;
	}

	// Fetch source metadata for "you were listening to" display
	const [sourceA, sourceB] = await Promise.all([
		db
			.select({
				title: sourceFiles.title,
				artist: sourceFiles.artist,
				featuredArtists: sourceFiles.featuredArtists,
				remixArtists: sourceFiles.remixArtists,
				streamUrl: sourceFiles.streamUrl
			})
			.from(sourceFiles)
			.innerJoin(candidateFiles, eq(candidateFiles.sourceFileId, sourceFiles.id))
			.where(eq(candidateFiles.id, candidateA.id))
			.get(),
		db
			.select({
				title: sourceFiles.title,
				artist: sourceFiles.artist,
				featuredArtists: sourceFiles.featuredArtists,
				remixArtists: sourceFiles.remixArtists,
				streamUrl: sourceFiles.streamUrl
			})
			.from(sourceFiles)
			.innerJoin(candidateFiles, eq(candidateFiles.sourceFileId, sourceFiles.id))
			.where(eq(candidateFiles.id, candidateB.id))
			.get()
	]);

	return {
		tokenA: tokenARow.token,
		tokenB: tokenBRow.token,
		tokenYwltA,
		tokenYwltB,
		transitionMode,
		roundMode: 'mixtape',
		startTime,
		duration: segmentDurationMs,
		labelA: {
			title: sourceA?.title ?? 'Unknown',
			artist: sourceA?.artist ?? null,
			featuredArtists: sourceA?.featuredArtists ?? null,
			remixArtists: sourceA?.remixArtists ?? null,
			streamUrl: sourceA?.streamUrl ?? null
		},
		labelB: {
			title: sourceB?.title ?? 'Unknown',
			artist: sourceB?.artist ?? null,
			featuredArtists: sourceB?.featuredArtists ?? null,
			remixArtists: sourceB?.remixArtists ?? null,
			streamUrl: sourceB?.streamUrl ?? null
		}
	};
};
