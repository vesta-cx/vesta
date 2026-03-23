import type { Handle } from '@sveltejs/kit';
import { createAuthHandle } from '@vesta-cx/auth';
import { createCorsHandle } from '@vesta-cx/utils/cors';
import { createSonaAuthRuntime } from '$lib/server/auth';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleCors = createCorsHandle();

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
		resolve: (e, opts) => {
			if (!e.platform) {
				return handleParaglide({
					event: e,
					resolve: (e2, opts2) => resolve(e2, opts2)
				});
			}

			const handleAuth = createAuthHandle({
				runtime: createSonaAuthRuntime(e.platform),
				protectedPaths: ['/admin']
			});

			return handleAuth({
				event: e,
				resolve: (e2, opts2) =>
					handleParaglide({
						event: e2,
						resolve: (e3, opts3) => resolve(e3, opts3)
					})
			});
		}
	});
