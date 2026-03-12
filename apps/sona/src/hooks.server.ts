import type { Handle } from '@sveltejs/kit';
import { createAuthHandle } from '@vesta-cx/utils/auth';
import { createCorsHandle } from '@vesta-cx/utils/cors';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleCors = createCorsHandle();
const handleAuth = createAuthHandle({
	protectedPaths: ['/admin'],
	postLoginRedirect: '/admin'
});

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

// Manual composition: CORS first (OPTIONS + headers), then auth, then paraglide
export const handle: Handle = async ({ event, resolve }) =>
	handleCors({
		event,
		resolve: (e, opts) =>
			handleAuth({
				event: e,
				resolve: (e2, opts2) =>
					handleParaglide({
						event: e2,
						resolve: (e3, opts3) => resolve(e3, opts3)
					})
			})
	});
