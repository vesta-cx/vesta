<script lang="ts">
	import { page } from '$app/state';
	import { locales, localizeHref } from '$lib/paraglide/runtime';
	import { Toaster } from '@vesta-cx/ui/components/ui/sonner';
	import {
		SITE_NAME,
		TAGLINE,
		META_DESCRIPTION,
		SITE_URL,
		IMAGES,
		absoluteUrl,
		pageTitle
	} from '$lib/constants/identity';
	import './layout.css';
	import '@vesta-cx/ui/styles/index.scss';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const canonicalUrl = $derived(absoluteUrl(page.url.pathname));
	const defaultTitle = $derived(pageTitle());
</script>

<svelte:head>
	<!-- Favicon -->
	<link rel="icon" href={favicon} type="image/svg+xml" />

	<!-- Primary meta -->
	<title>{defaultTitle}</title>
	<meta name="description" content={META_DESCRIPTION} />
	<link rel="canonical" href={canonicalUrl} />

	<!-- Open Graph -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={defaultTitle} />
	<meta property="og:description" content={META_DESCRIPTION} />
	<meta property="og:url" content={canonicalUrl} />
	{#if IMAGES.ogImage}
		<meta property="og:image" content={absoluteUrl(IMAGES.ogImage)} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={defaultTitle} />
	<meta name="twitter:description" content={META_DESCRIPTION} />
	{#if IMAGES.ogImage}
		<meta name="twitter:image" content={absoluteUrl(IMAGES.ogImage)} />
	{/if}

	<!-- Mobile / PWA -->
	<meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
	<meta name="theme-color" content="#fafafa" media="(prefers-color-scheme: light)" />
</svelte:head>

<div class="relative">
	{@render children()}
</div>
<Toaster position="bottom-right" />
<div style="display:none">
	{#each locales as locale}
		<a href={localizeHref(page.url.pathname, { locale })}>
			{locale}
		</a>
	{/each}
</div>
