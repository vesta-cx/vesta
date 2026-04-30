import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
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

	// In dev we re-provision the user/organization rows on every authenticated
	// request so D1 wipes (migration squashes, fresh-clone setups) self-heal
	// without forcing a logout. In prod the OAuth callback is the only
	// provisioning surface — each request becomes a no-op write otherwise.
	const handleAuth = createAuthHandle({
		runtime: createWebAuthRuntime(event.platform),
		protectedPaths: ['/dashboard'],
		...(dev ? { provisioningAdapter: createWebProvisioningAdapter(event.platform) } : {})
	});

	return handleAuth({
		event,
		resolve: (eventWithAuth) =>
			handleParaglide({
				event: eventWithAuth,
				resolve: (finalEvent, finalOptions) => resolve(finalEvent, finalOptions)
			})
	});
};
