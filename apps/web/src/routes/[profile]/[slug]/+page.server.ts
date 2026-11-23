import { error } from '@sveltejs/kit';
import { loadPost } from '$lib/server/blog/posts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	return loadPost(params.profile, params.slug) ?? error(404, 'Post not found');
};
