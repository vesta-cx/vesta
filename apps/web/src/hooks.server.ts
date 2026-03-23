import type { Handle } from '@sveltejs/kit';
import { createAuthHandle } from '@vesta-cx/auth';
import { createWebAuthRuntime, createWebProvisioningAdapter } from '$lib/server/auth';
import { paraglideMiddleware } from '$lib/paraglide/server';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;

		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

export const handle: Handle = async ({ event, resolve }) => {
	if (!event.platform) {
		(event.locals as { session: App.Locals['session'] }).session = null;
		return handleParaglide({ event, resolve });
	}

	const handleAuth = createAuthHandle({
		runtime: createWebAuthRuntime(event.platform),
		protectedPaths: [],
		provisioningAdapter: createWebProvisioningAdapter(event.platform)
	});

	return handleAuth({
		event,
		resolve: (eventWithAuth, options) =>
			handleParaglide({
				event: eventWithAuth,
				resolve: (finalEvent, finalOptions) => resolve(finalEvent, finalOptions)
			})
	});
};
