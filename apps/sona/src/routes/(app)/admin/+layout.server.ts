import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Session is guaranteed by createAuthHandle — /admin is a protected path.
	// The handle redirects to /auth/login if unauthenticated.
	const session = locals.session!;

	return {
		session: {
			email: session.email,
			userId: session.userId,
			organizationId: session.organizationId,
			firstName: session.firstName,
			lastName: session.lastName,
			profilePictureUrl: session.profilePictureUrl
		}
	};
};
