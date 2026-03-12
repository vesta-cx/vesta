import { getStorage } from '$lib/server/storage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, url }) => {
	if (!platform) return { objects: [], truncated: false, prefix: '', cursor: null };

	const storage = getStorage(platform);
	const prefix = url.searchParams.get('prefix') ?? '';
	const cursor = url.searchParams.get('cursor');
	const limit = 100;

	const result = await storage.list({
		prefix: prefix || undefined,
		limit,
		cursor: cursor ?? undefined
	});

	return {
		objects: result.objects,
		truncated: result.truncated,
		cursor: result.cursor ?? null,
		prefix
	};
};
