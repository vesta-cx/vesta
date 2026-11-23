import { error } from '@sveltejs/kit';
import { loadProfile } from '$lib/server/blog/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	return loadProfile(params.profile) ?? error(404, 'Profile not found');
};
