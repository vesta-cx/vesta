<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
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

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>Profile preview</Card.Title>
			<Card.Description>How the workspace appears on release pages.</Card.Description>
		</Card.Header>
		<Card.Content>
			<div
				class="flex items-center gap-4 rounded-xl border p-4"
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
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Theme tokens</Card.Title>
			<Card.Description>Applied across release pages and smart links.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2 text-sm">
			{#each themeTokens as token (token.label)}
				<div class="flex items-center justify-between gap-3 rounded-lg border p-3">
					<span class="font-medium">{token.label}</span>
					<span class="truncate font-mono text-xs text-muted-foreground">{token.value}</span>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>

<Card.Root>
	<Card.Header>
		<Card.Title>External links</Card.Title>
		<Card.Description>Where else the workspace lives. Drag to reorder.</Card.Description>
	</Card.Header>
	<Card.Content class="grid gap-2 md:grid-cols-2">
		{#each links as link (link.name)}
			<div class="grid gap-0.5 rounded-lg border p-3">
				<p class="text-sm font-medium">{link.name}</p>
				<p class="truncate text-xs text-muted-foreground">{link.url}</p>
			</div>
		{/each}
	</Card.Content>
</Card.Root>
