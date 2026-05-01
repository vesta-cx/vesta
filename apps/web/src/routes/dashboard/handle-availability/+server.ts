import { json } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import {
	RESERVED_HANDLES,
	USER_HANDLE_MAX_LENGTH,
	USER_HANDLE_MIN_LENGTH,
	USER_HANDLE_PATTERN,
	normalizeUserHandle
} from '@vesta-cx/db/entity-schemas';
import { users } from '@vesta-cx/db';
import { getDb } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	if (!locals.session)
		return json({ available: false, reason: 'Unauthenticated' }, { status: 401 });
	if (!platform)
		return json({ available: false, reason: 'Platform not available' }, { status: 500 });

	const handle = url.searchParams.get('handle')?.trim() ?? '';
	if (handle.length < USER_HANDLE_MIN_LENGTH) {
		return json({ available: false, reason: `Use at least ${USER_HANDLE_MIN_LENGTH} characters.` });
	}
	if (handle.length > USER_HANDLE_MAX_LENGTH) {
		return json({ available: false, reason: `Use ${USER_HANDLE_MAX_LENGTH} characters or fewer.` });
	}
	if (!USER_HANDLE_PATTERN.test(handle)) {
		return json({ available: false, reason: 'Use letters, numbers, hyphens, or underscores.' });
	}

	const handleNormalized = normalizeUserHandle(handle);
	if (RESERVED_HANDLES.has(handleNormalized)) {
		return json({ available: false, reason: 'That handle is reserved.' });
	}

	const db = getDb(platform);
	const [existing] = await db
		.select({ workosUserId: users.workosUserId })
		.from(users)
		.where(
			and(
				eq(users.handleNormalized, handleNormalized),
				ne(users.workosUserId, locals.session.userId)
			)
		)
		.limit(1);

	return json({
		available: !existing,
		reason: existing ? 'That handle is already taken.' : null
	});
};
