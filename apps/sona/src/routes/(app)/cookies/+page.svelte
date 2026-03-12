<script lang="ts">
	import { pageTitle } from '$lib/constants/identity';
	import { Section, SectionContent } from '@vesta-cx/ui/components/layout/section';
	import { CookieConsentForm } from '@vesta-cx/ui/components/utils/cookie-consent-form';
	import type { VendorDefinition } from '@vesta-cx/utils/cookies';

	const vendors: VendorDefinition[] = [
		{
			id: 'cloudflare',
			name: 'Cloudflare',
			description: 'Web analytics and performance monitoring',
			privacyUrl: 'https://www.cloudflare.com/privacypolicy/'
		}
	];
</script>

<svelte:head>
	<title>{pageTitle('Cookie Settings')}</title>
</svelte:head>

<Section>
	<SectionContent>
		<h1 class="text-2xl font-bold tracking-tight">Cookie Settings</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Manage your cookie preferences. Changes are saved immediately.
		</p>

		<div class="mt-6">
			<CookieConsentForm {vendors} />
		</div>
	</SectionContent>
</Section>
