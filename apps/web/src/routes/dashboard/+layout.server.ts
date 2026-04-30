import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// hooks.server.ts protects /dashboard, but guard explicitly so the layout
	// always has a session when it renders.
	if (!locals.session) redirect(302, '/auth/login');

	const { firstName, lastName, email, profilePictureUrl } = locals.session;
	const fullName = [firstName, lastName].filter(Boolean).join(' ');

	return {
		user: {
			name: fullName || email,
			email,
			avatarUrl: profilePictureUrl ?? undefined
		}
	};
};
