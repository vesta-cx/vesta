<script lang="ts">
	import { page } from '$app/state';
	import {
		Root as Header,
		Logo as HeaderLogo,
		Actions as HeaderActions
	} from '@vesta-cx/ui/components/layout/header';
	import { Main } from '@vesta-cx/ui/components/layout/main';
	import { CookieConsentDialog } from '@vesta-cx/ui/components/utils/cookie-consent-dialog';
	import { ThemeSwitcher } from '@vesta-cx/ui/components/utils/theme-switcher';
	import type { VendorDefinition } from '@vesta-cx/utils/cookies';
	import { SITE_NAME } from '$lib/constants/identity';
	import VestaFooter from './footer.svelte';

	let { children } = $props();

	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));

	const vendors: VendorDefinition[] = [
		{
			id: 'cloudflare',
			name: 'Cloudflare',
			description: 'Web analytics and performance monitoring',
			privacyUrl: 'https://www.cloudflare.com/privacypolicy/'
		}
	];
</script>

{#if !isAdmin}
	<Header class="z-50">
		<HeaderLogo class="flex items-center gap-2">
			<a href="/" class="text-sm font-bold tracking-tight">{SITE_NAME}</a>
		</HeaderLogo>
		<HeaderActions>
			<ThemeSwitcher.Root variant="dropdown" />
		</HeaderActions>
	</Header>
{/if}

<Main>
	{@render children()}
</Main>

{#if !isAdmin}
	<VestaFooter />
{/if}
<CookieConsentDialog {vendors} />
