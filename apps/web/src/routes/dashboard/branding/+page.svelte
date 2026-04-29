<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';

	const links = [
		{ name: 'Spotify', url: 'open.spotify.com/artist/...' },
		{ name: 'Bandcamp', url: 'hollowcoast.bandcamp.com' },
		{ name: 'Instagram', url: 'instagram.com/hollowcoast.music' },
		{ name: 'Mailing list', url: 'hollowcoast.com/newsletter' }
	];

	const themeTokens = [
		{ label: 'Primary', value: 'oklch(0.45 0.16 290)' },
		{ label: 'Accent', value: 'oklch(0.62 0.18 250)' },
		{ label: 'Surface', value: 'oklch(0.985 0 0)' },
		{ label: 'Heading font', value: 'Archivo' }
	];
</script>

<svelte:head>
	<title>Branding · Vesta</title>
</svelte:head>

<SectionHeader
	title="Branding"
	description="Workspace identity: profile, links, and the visual tokens that flow through release pages."
>
	{#snippet actions()}
		<Button size="sm" variant="outline" href="/dashboard/branding/links">Edit links</Button>
		<Button size="sm" href="/dashboard/branding/profile">Edit profile</Button>
	{/snippet}
</SectionHeader>

<section class="space-y-3">
	<header class="space-y-1">
		<h2 class="text-base font-medium">Profile preview</h2>
		<p class="text-sm text-muted-foreground">How the workspace appears on release pages.</p>
	</header>
	<div
		class="flex items-center gap-4 rounded-xl border p-5"
		style:background="linear-gradient(135deg, oklch(0.985 0 0), oklch(0.94 0.01 270))"
	>
		<div
			class="flex aspect-square size-16 items-center justify-center rounded-xl text-xl font-semibold text-primary-foreground"
			style:background="linear-gradient(135deg, oklch(0.45 0.16 290), oklch(0.32 0.12 320))"
		>
			HC
		</div>
		<div class="grid gap-1">
			<p class="text-lg font-semibold">Hollow Coast</p>
			<p class="text-sm text-muted-foreground">
				Indie folk · Brooklyn / Lisbon · listening for what's underneath.
			</p>
		</div>
	</div>
</section>

<Separator />

<div class="grid gap-8 lg:grid-cols-2">
	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">External links</h2>
			<p class="text-sm text-muted-foreground">Where else the workspace lives. Drag to reorder.</p>
		</header>
		<ul class="-mx-2 grid">
			{#each links as link (link.name)}
				<li class="grid gap-0.5 px-2 py-3">
					<p class="text-sm font-medium">{link.name}</p>
					<p class="truncate text-xs text-muted-foreground">{link.url}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">Theme tokens</h2>
			<p class="text-sm text-muted-foreground">Applied across release pages and smart links.</p>
		</header>
		<ul class="-mx-2 grid">
			{#each themeTokens as token (token.label)}
				<li class="flex items-center justify-between gap-3 px-2 py-3">
					<span class="text-sm font-medium">{token.label}</span>
					<span class="truncate font-mono text-xs text-muted-foreground">{token.value}</span>
				</li>
			{/each}
		</ul>
	</section>
</div>
