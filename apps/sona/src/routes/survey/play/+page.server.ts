import { getDb } from '$lib/server/db';
import { generateRound } from '$lib/server/game';
import { TRANSITION_MODES } from '$lib/server/db/schema';
import type { TransitionMode } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const COOKIE_SESSION = 'survey_session';
const COOKIE_MODES = 'transition_modes';
const COOKIE_PAIRING = 'pairing_types';

const parseEnabledModes = (val: string | undefined): TransitionMode[] | null => {
	if (!val?.trim()) return null;
	const modes = val.split(',').map((s) => s.trim()) as TransitionMode[];
	const valid = modes.filter((m) => TRANSITION_MODES.includes(m));
	return valid.length > 0 ? valid : null;
};

const parseEnabledPairing = (val: string | undefined): boolean => {
	if (!val?.trim()) return true; // default: allow different_song
	return val
		.split(',')
		.map((s) => s.trim())
		.includes('different_song');
};

export const load: PageServerLoad = async ({ cookies, platform, locals }) => {
	let sessionId = cookies.get(COOKIE_SESSION);
	if (!sessionId) {
		sessionId = crypto.randomUUID();
		cookies.set(COOKIE_SESSION, sessionId, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax'
			// No maxAge = session cookie (until browser close)
		});
	}

	const deviceId = cookies.get('device_id');
	if (!deviceId) {
		redirect(302, '/survey/setup');
	}
	if (!platform) {
		return {
			round: null,
			deviceId,
			sessionId,
			enabledModes: [...TRANSITION_MODES] as TransitionMode[],
			allowDifferentSong: true,
			error: 'Platform not available'
		};
	}

	const enabledModes = parseEnabledModes(cookies.get(COOKIE_MODES));
	const allowDifferentSong = parseEnabledPairing(cookies.get(COOKIE_PAIRING));
	const enabledPairing: ('same_song' | 'different_song')[] = allowDifferentSong
		? ['same_song', 'different_song']
		: ['same_song'];

	const db = getDb(platform);
	const round = await generateRound(db, enabledModes, enabledPairing);

	if (!round) {
		return {
			round: null,
			deviceId,
			sessionId,
			enabledModes: enabledModes ?? ([...TRANSITION_MODES] as TransitionMode[]),
			allowDifferentSong,
			error: 'No audio comparisons available yet. Check back soon!'
		};
	}

	return {
		round: {
			tokenA: round.tokenA,
			tokenB: round.tokenB,
			tokenYwltA: round.tokenYwltA,
			tokenYwltB: round.tokenYwltB,
			transitionMode: round.transitionMode,
			roundMode: round.roundMode,
			startTime: round.startTime,
			duration: round.duration,
			labelA: round.labelA,
			labelB: round.labelB
		},
		deviceId,
		sessionId,
		isAdmin: !!locals.session,
		enabledModes: enabledModes ?? ([...TRANSITION_MODES] as TransitionMode[]),
		allowDifferentSong,
		error: null
	};
};
