import { eq } from 'drizzle-orm';
import type { Database } from './db';
import { surveyConfig } from './db/schema';

export const PAIRING_WEIGHTS_KEY = 'pairing_weights';
export const SEGMENT_DURATION_KEY = 'segment_duration_ms';
export const PLACEBO_PROBABILITY_KEY = 'placebo_probability';
export const PERMUTATION_WEIGHTS_KEY = 'permutation_weights';
export const TRANSITION_WEIGHTS_KEY = 'transition_weights';
export const MODE_WEIGHTS_KEY = 'mode_weights';
export const TRADEOFF_MIN_GAP_KEY = 'tradeoff_min_gap';
export const TRADEOFF_MAX_GAP_KEY = 'tradeoff_max_gap';
export const TRADEOFF_GAP_POINTS_KEY = 'tradeoff_gap_points';

export const DEFAULT_SEGMENT_DURATION_MS = 12_000;
export const DEFAULT_PLACEBO_PROBABILITY = 0.1;

/** Pairing weights for same_song vs different_song only. Placebo is controlled by placebo_probability. */
export type PairingWeights = { same_song: number; different_song: number };

const DEFAULT_PAIRING_WEIGHTS: PairingWeights = {
	same_song: 0.7,
	different_song: 0.2
};

/** Weights keyed by codec_bitrate (e.g. "flac_0", "opus_128"). */
export type PermutationWeights = Record<string, number>;

/** Weights for transition modes: gapless, gap_continue, gap_restart, gap_pause_resume. */
export type TransitionWeights = {
	gapless: number;
	gap_continue: number;
	gap_restart: number;
	gap_pause_resume: number;
};

export const DEFAULT_TRANSITION_WEIGHTS: TransitionWeights = {
	gapless: 1,
	gap_continue: 1,
	gap_restart: 1,
	gap_pause_resume: 1
};

/** Game mode weights for Mixtape: codec_compare, bitrate_battle, genre_trials, tradeoff. */
export type ModeWeights = {
	codec_compare: number;
	bitrate_battle: number;
	genre_trials: number;
	tradeoff: number;
};

export const DEFAULT_MODE_WEIGHTS: ModeWeights = {
	codec_compare: 1,
	bitrate_battle: 1,
	genre_trials: 1,
	tradeoff: 1
};

export type TradeoffGapPoint = { gap: number; weight: number };

export type TradeoffGapConfig = {
	min_gap: number;
	max_gap: number;
	gap_points: TradeoffGapPoint[];
};

export const DEFAULT_TRADEOFF_GAP_CONFIG: TradeoffGapConfig = {
	min_gap: 0.5,
	max_gap: 2.5,
	gap_points: [
		{ gap: 0.5, weight: 0.2 },
		{ gap: 1.5, weight: 0.5 },
		{ gap: 2.5, weight: 0.3 }
	]
};

const getConfigValue = async (db: Database, key: string): Promise<string | null> => {
	const row = await db
		.select({ value: surveyConfig.value })
		.from(surveyConfig)
		.where(eq(surveyConfig.key, key))
		.get();
	return row?.value ?? null;
};

const setConfigValue = async (db: Database, key: string, value: string): Promise<void> => {
	await db.insert(surveyConfig).values({ key, value }).onConflictDoUpdate({
		target: surveyConfig.key,
		set: { value }
	});
};

export const getPairingWeights = async (db: Database): Promise<PairingWeights> => {
	const value = await getConfigValue(db, PAIRING_WEIGHTS_KEY);
	if (!value) return { ...DEFAULT_PAIRING_WEIGHTS };
	try {
		const parsed = JSON.parse(value) as Record<string, number>;
		const weights: PairingWeights = { ...DEFAULT_PAIRING_WEIGHTS };
		if (typeof parsed.same_song === 'number' && parsed.same_song >= 0) {
			weights.same_song = parsed.same_song;
		}
		if (typeof parsed.different_song === 'number' && parsed.different_song >= 0) {
			weights.different_song = parsed.different_song;
		}
		return weights;
	} catch {
		return { ...DEFAULT_PAIRING_WEIGHTS };
	}
};

export const setPairingWeights = async (db: Database, weights: PairingWeights): Promise<void> => {
	await setConfigValue(db, PAIRING_WEIGHTS_KEY, JSON.stringify(weights));
};

export const getPlaceboProbability = async (db: Database): Promise<number> => {
	const value = await getConfigValue(db, PLACEBO_PROBABILITY_KEY);
	if (!value) return DEFAULT_PLACEBO_PROBABILITY;
	const parsed = parseFloat(value);
	if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
		return DEFAULT_PLACEBO_PROBABILITY;
	}
	return parsed;
};

export const setPlaceboProbability = async (db: Database, probability: number): Promise<void> => {
	const clamped = Math.max(0, Math.min(1, probability));
	await setConfigValue(db, PLACEBO_PROBABILITY_KEY, String(clamped));
};

export const getPermutationWeights = async (db: Database): Promise<PermutationWeights> => {
	const value = await getConfigValue(db, PERMUTATION_WEIGHTS_KEY);
	if (!value) return {};
	try {
		const parsed = JSON.parse(value) as Record<string, number>;
		const result: PermutationWeights = {};
		for (const [k, v] of Object.entries(parsed)) {
			if (typeof k === 'string' && typeof v === 'number' && v >= 0) {
				result[k] = v;
			}
		}
		return result;
	} catch {
		return {};
	}
};

export const setPermutationWeights = async (
	db: Database,
	weights: PermutationWeights
): Promise<void> => {
	await setConfigValue(db, PERMUTATION_WEIGHTS_KEY, JSON.stringify(weights));
};

export const getTransitionWeights = async (db: Database): Promise<TransitionWeights> => {
	const value = await getConfigValue(db, TRANSITION_WEIGHTS_KEY);
	if (!value) return { ...DEFAULT_TRANSITION_WEIGHTS };
	try {
		const parsed = JSON.parse(value) as Record<string, number>;
		const weights: TransitionWeights = { ...DEFAULT_TRANSITION_WEIGHTS };
		for (const key of Object.keys(weights) as (keyof TransitionWeights)[]) {
			if (typeof parsed[key] === 'number' && parsed[key] >= 0) {
				weights[key] = parsed[key];
			}
		}
		return weights;
	} catch {
		return { ...DEFAULT_TRANSITION_WEIGHTS };
	}
};

export const setTransitionWeights = async (
	db: Database,
	weights: TransitionWeights
): Promise<void> => {
	await setConfigValue(db, TRANSITION_WEIGHTS_KEY, JSON.stringify(weights));
};

export const getModeWeights = async (db: Database): Promise<ModeWeights> => {
	const value = await getConfigValue(db, MODE_WEIGHTS_KEY);
	if (!value) return { ...DEFAULT_MODE_WEIGHTS };
	try {
		const parsed = JSON.parse(value) as Record<string, number>;
		const weights: ModeWeights = { ...DEFAULT_MODE_WEIGHTS };
		for (const key of Object.keys(weights) as (keyof ModeWeights)[]) {
			if (typeof parsed[key] === 'number' && parsed[key] >= 0) {
				weights[key] = parsed[key];
			}
		}
		return weights;
	} catch {
		return { ...DEFAULT_MODE_WEIGHTS };
	}
};

export const setModeWeights = async (db: Database, weights: ModeWeights): Promise<void> => {
	await setConfigValue(db, MODE_WEIGHTS_KEY, JSON.stringify(weights));
};

export const getTradeoffGapConfig = async (db: Database): Promise<TradeoffGapConfig> => {
	const minVal = await getConfigValue(db, TRADEOFF_MIN_GAP_KEY);
	const maxVal = await getConfigValue(db, TRADEOFF_MAX_GAP_KEY);
	const pointsVal = await getConfigValue(db, TRADEOFF_GAP_POINTS_KEY);
	const config: TradeoffGapConfig = { ...DEFAULT_TRADEOFF_GAP_CONFIG };

	if (minVal !== null) {
		const parsed = parseFloat(minVal);
		if (Number.isFinite(parsed) && parsed >= 0) config.min_gap = parsed;
	}
	if (maxVal !== null) {
		const parsed = parseFloat(maxVal);
		if (Number.isFinite(parsed) && parsed >= config.min_gap) config.max_gap = parsed;
	}
	if (pointsVal !== null) {
		try {
			const parsed = JSON.parse(pointsVal) as TradeoffGapPoint[];
			if (Array.isArray(parsed) && parsed.length > 0) {
				config.gap_points = parsed.filter(
					(p): p is TradeoffGapPoint =>
						typeof p?.gap === 'number' && typeof p?.weight === 'number' && p.weight >= 0
				);
			}
		} catch {
			// keep default
		}
	}
	return config;
};

export const setTradeoffGapConfig = async (
	db: Database,
	config: TradeoffGapConfig
): Promise<void> => {
	const minClamped = Math.max(0, config.min_gap);
	const maxClamped = Math.max(minClamped, config.max_gap);
	const points = config.gap_points.filter(
		(p): p is TradeoffGapPoint =>
			typeof p.gap === 'number' && typeof p.weight === 'number' && p.weight >= 0
	);
	await Promise.all([
		setConfigValue(db, TRADEOFF_MIN_GAP_KEY, String(minClamped)),
		setConfigValue(db, TRADEOFF_MAX_GAP_KEY, String(maxClamped)),
		setConfigValue(db, TRADEOFF_GAP_POINTS_KEY, JSON.stringify(points))
	]);
};

export const getSegmentDuration = async (db: Database): Promise<number> => {
	const row = await db
		.select({ value: surveyConfig.value })
		.from(surveyConfig)
		.where(eq(surveyConfig.key, SEGMENT_DURATION_KEY))
		.get();

	if (!row?.value) return DEFAULT_SEGMENT_DURATION_MS;

	const parsed = parseInt(row.value, 10);
	if (!Number.isInteger(parsed) || parsed < 1000 || parsed > 120_000) {
		return DEFAULT_SEGMENT_DURATION_MS;
	}
	return parsed;
};

export const setSegmentDuration = async (db: Database, ms: number): Promise<void> => {
	const clamped = Math.max(1000, Math.min(120_000, Math.round(ms)));
	await db
		.insert(surveyConfig)
		.values({
			key: SEGMENT_DURATION_KEY,
			value: String(clamped)
		})
		.onConflictDoUpdate({
			target: surveyConfig.key,
			set: { value: String(clamped) }
		});
};
