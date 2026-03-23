import type { Handle } from '@sveltejs/kit';
import { createAuthHandle, type AuthSession } from '@vesta-cx/auth';
import { createCorsHandle } from '@vesta-cx/utils/cors';
import { createSonaAuthRuntime } from '$lib/server/auth';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleCors = createCorsHandle();
const protectedPaths = ['/admin'];

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
				(e.locals as { session: AuthSession | null }).session = null;

				if (protectedPaths.some((path) => e.url.pathname.startsWith(path))) {
					return new Response('Unauthorized', { status: 401 });
				}

				return handleParaglide({
					event: e,
					resolve: (e2, opts2) => resolve(e2, opts2)
				});
			}

			const handleAuth = createAuthHandle({
				runtime: createSonaAuthRuntime(e.platform),
				protectedPaths
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
