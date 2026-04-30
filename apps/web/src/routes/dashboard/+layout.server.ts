import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// hooks.server.ts protects /dashboard, but guard explicitly so the layout
	// always has a session when it renders.
	if (!locals.session) redirect(302, '/auth/login');

	const { firstName, lastName, email, profilePictureUrl } = locals.session;
	const legalName = [firstName, lastName].filter(Boolean).join(' ');

	// TODO: Read displayName and username from the Vesta user profile once that
	// surface lands. Until then we fall back to the WorkOS legal name + the
	// email local-part so the user picker has reasonable defaults.
	return {
		user: {
			name: legalName || email,
			email,
			avatarUrl: profilePictureUrl ?? undefined,
			displayName: legalName || email,
			username: email.split('@')[0] ?? email
		}
	};
};
