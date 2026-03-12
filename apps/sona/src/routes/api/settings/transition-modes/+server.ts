import { json } from '@sveltejs/kit';
import { TRANSITION_MODES } from '$lib/server/db/schema';
import type { TransitionMode } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

const COOKIE_MODES = 'transition_modes';
const COOKIE_PAIRING = 'pairing_types';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = (await request.json()) as {
		modes?: unknown;
		allowDifferentSong?: boolean;
	};

	const cookieOpts = {
		path: '/' as const,
		maxAge: COOKIE_MAX_AGE,
		httpOnly: false as const,
		sameSite: 'lax' as const
	};

	if (body.modes !== undefined) {
		const modes = body.modes as unknown;
		if (!Array.isArray(modes)) {
			return json({ error: 'modes must be an array' }, { status: 400 });
		}
		const valid = modes.filter((m): m is TransitionMode => TRANSITION_MODES.includes(m));
		if (valid.length === 0) {
			return json({ error: 'at least one valid mode required' }, { status: 400 });
		}
		cookies.set(COOKIE_MODES, valid.join(','), cookieOpts);
	}

	if (body.allowDifferentSong !== undefined) {
		cookies.set(
			COOKIE_PAIRING,
			body.allowDifferentSong ? 'same_song,different_song,placebo' : 'same_song,placebo',
			cookieOpts
		);
	}

	return json({ success: true });
};
