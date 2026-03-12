import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { qualityOptions } from '$lib/server/db/schema';
import {
	getPairingWeights,
	setPairingWeights,
	getPlaceboProbability,
	setPlaceboProbability,
	getPermutationWeights,
	setPermutationWeights,
	getTransitionWeights,
	setTransitionWeights,
	getModeWeights,
	setModeWeights,
	getTradeoffGapConfig,
	setTradeoffGapConfig,
	getSegmentDuration,
	setSegmentDuration,
	type PairingWeights,
	type TransitionWeights,
	type ModeWeights,
	type TradeoffGapConfig,
	type TradeoffGapPoint
} from '$lib/server/survey-config';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) {
		return {
			pairingWeights: null,
			placeboProbability: null,
			enabledOptions: [],
			permutationWeights: null,
			transitionWeights: null,
			modeWeights: null,
			tradeoffGapConfig: null,
			segmentDurationMs: null
		};
	}

	const db = getDb(platform);
	const [enabledOpts, ...rest] = await Promise.all([
		db.select().from(qualityOptions).where(eq(qualityOptions.enabled, true)).all(),
		getPairingWeights(db),
		getPlaceboProbability(db),
		getPermutationWeights(db),
		getTransitionWeights(db),
		getModeWeights(db),
		getTradeoffGapConfig(db),
		getSegmentDuration(db)
	]);

	const [
		pairingWeights,
		placeboProbability,
		permutationWeights,
		transitionWeights,
		modeWeights,
		tradeoffGapConfig,
		segmentDurationMs
	] = rest;

	return {
		pairingWeights,
		placeboProbability,
		enabledOptions: enabledOpts,
		permutationWeights,
		transitionWeights,
		modeWeights,
		tradeoffGapConfig,
		segmentDurationMs
	};
};

export const actions = {
	savePairing: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const data = await request.formData();
		const same = parseFloat(data.get('same_song') as string);
		const different = parseFloat(data.get('different_song') as string);
		if (!Number.isFinite(same) || same < 0 || !Number.isFinite(different) || different < 0) {
			return fail(400, { error: 'Weights must be non-negative numbers' });
		}
		if (same === 0 && different === 0) {
			return fail(400, { error: 'At least one weight must be positive' });
		}
		const weights: PairingWeights = { same_song: same, different_song: different };
		await setPairingWeights(getDb(platform), weights);
		return { success: true, section: 'pairing' };
	},

	savePlacebo: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const data = await request.formData();
		const raw = data.get('placebo_probability');
		const v = typeof raw === 'string' ? parseFloat(raw) : NaN;
		if (!Number.isFinite(v) || v < 0 || v > 1) {
			return fail(400, { error: 'Placebo probability must be 0–1 (or 0–100%)' });
		}
		await setPlaceboProbability(getDb(platform), v);
		return { success: true, section: 'placebo' };
	},

	savePermutation: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const data = await request.formData();
		const weights: Record<string, number> = {};
		for (const [key, val] of data.entries()) {
			if (key.startsWith('perm_')) {
				const k = key.slice(5);
				const v = parseFloat(val as string);
				if (Number.isFinite(v) && v >= 0) weights[k] = v;
			}
		}
		const total = Object.values(weights).reduce((a, b) => a + b, 0);
		if (total <= 0) {
			return fail(400, { error: 'At least one permutation weight must be positive' });
		}
		await setPermutationWeights(getDb(platform), weights);
		return { success: true, section: 'permutation' };
	},

	saveTransition: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const data = await request.formData();
		const weights: TransitionWeights = {
			gapless: parseFloat(data.get('gapless') as string) ?? 1,
			gap_continue: parseFloat(data.get('gap_continue') as string) ?? 1,
			gap_restart: parseFloat(data.get('gap_restart') as string) ?? 1,
			gap_pause_resume: parseFloat(data.get('gap_pause_resume') as string) ?? 1
		};
		for (const [k, v] of Object.entries(weights)) {
			if (!Number.isFinite(v) || v < 0) {
				return fail(400, { error: `Invalid weight for ${k}` });
			}
		}
		if (Object.values(weights).every((w) => w === 0)) {
			return fail(400, { error: 'At least one transition weight must be positive' });
		}
		await setTransitionWeights(getDb(platform), weights);
		return { success: true, section: 'transition' };
	},

	saveMode: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const data = await request.formData();
		const weights: ModeWeights = {
			codec_compare: parseFloat(data.get('codec_compare') as string) ?? 1,
			bitrate_battle: parseFloat(data.get('bitrate_battle') as string) ?? 1,
			genre_trials: parseFloat(data.get('genre_trials') as string) ?? 1,
			tradeoff: parseFloat(data.get('tradeoff') as string) ?? 1
		};
		for (const [k, v] of Object.entries(weights)) {
			if (!Number.isFinite(v) || v < 0) {
				return fail(400, { error: `Invalid weight for ${k}` });
			}
		}
		if (Object.values(weights).every((w) => w === 0)) {
			return fail(400, { error: 'At least one mode weight must be positive' });
		}
		await setModeWeights(getDb(platform), weights);
		return { success: true, section: 'mode' };
	},

	saveTradeoffGap: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const data = await request.formData();
		const min_gap = parseFloat(data.get('min_gap') as string);
		const max_gap = parseFloat(data.get('max_gap') as string);
		const pointsJson = data.get('gap_points') as string;
		if (!Number.isFinite(min_gap) || min_gap < 0) {
			return fail(400, { error: 'Min gap must be a non-negative number' });
		}
		if (!Number.isFinite(max_gap) || max_gap < min_gap) {
			return fail(400, { error: 'Max gap must be ≥ min gap' });
		}
		let gap_points: TradeoffGapPoint[] = [];
		if (pointsJson?.trim()) {
			try {
				const parsed = JSON.parse(pointsJson) as unknown;
				if (Array.isArray(parsed)) {
					gap_points = parsed.filter(
						(p): p is TradeoffGapPoint =>
							typeof (p as TradeoffGapPoint)?.gap === 'number' &&
							typeof (p as TradeoffGapPoint)?.weight === 'number' &&
							(p as TradeoffGapPoint).weight >= 0
					);
				}
			} catch {
				return fail(400, { error: 'Gap points must be valid JSON: [{ gap, weight }, ...]' });
			}
		}
		if (gap_points.length === 0) {
			gap_points = [
				{ gap: 0.5, weight: 0.2 },
				{ gap: 1.5, weight: 0.5 },
				{ gap: 2.5, weight: 0.3 }
			];
		}
		const config: TradeoffGapConfig = { min_gap, max_gap, gap_points };
		await setTradeoffGapConfig(getDb(platform), config);
		return { success: true, section: 'tradeoff' };
	},

	saveSegmentDuration: async ({ request, platform }) => {
		if (!platform) return fail(500, { error: 'Platform not available' });
		const data = await request.formData();
		const raw = data.get('segment_duration_ms');
		const v = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
		if (!Number.isInteger(v) || v < 1000 || v > 120_000) {
			return fail(400, { error: 'Segment duration must be 1000–120000 ms (1–120 s)' });
		}
		await setSegmentDuration(getDb(platform), v);
		return { success: true, section: 'segment', segmentDurationSaved: true };
	}
} satisfies Actions;
