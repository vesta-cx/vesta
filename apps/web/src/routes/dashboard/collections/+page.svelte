<script lang="ts" module>
	const stats = [
		{ label: 'Collections', value: 14, helper: '8 playlists · 6 roster groups' },
		{ label: 'Items in collections', value: 218, helper: 'across all collections' },
		{ label: 'Updated · 30d', value: 9, helper: 'most recent: 2h ago' }
	];

	const collections = [
		{ title: 'Tidewater rollout', kind: 'Playlist', count: 12, updated: '2h ago' },
		{ title: 'Topaz roster · active', kind: 'Roster', count: 8, updated: 'yesterday' },
		{ title: 'Late-night listens', kind: 'Playlist', count: 24, updated: '4d ago' },
		{ title: 'Spring 2026 picks', kind: 'Playlist', count: 16, updated: 'a week ago' }
	];
</script>

<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
	import Stat from '$lib/components/dashboard/stat.svelte';
</script>

<svelte:head>
	<title>Collections · Vesta</title>
</svelte:head>

<SectionHeader
	title="Collections"
	description="Playlists, label rosters, and curated bundles that group resources."
>
	{#snippet actions()}
		<Button size="sm" variant="outline" href="/dashboard/collections/roster">Open roster</Button>
		<Button size="sm" href="/dashboard/collections/playlists">New playlist</Button>
	{/snippet}
</SectionHeader>

<div class="grid gap-6 md:grid-cols-3">
	{#each stats as stat (stat.label)}
		<Stat label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<Separator />

<section class="space-y-3">
	<header class="space-y-1">
		<h2 class="text-base font-medium">Recent collections</h2>
		<p class="text-sm text-muted-foreground">What's been edited or added to lately.</p>
	</header>
	<ul class="-mx-2 grid md:grid-cols-2">
		{#each collections as collection (collection.title)}
			<li>
				<a
					href="/dashboard/collections"
					class="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
				>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{collection.title}</p>
						<p class="text-xs text-muted-foreground">
							{collection.count} items · updated {collection.updated}
						</p>
					</div>
					<span class="shrink-0 text-xs text-muted-foreground">{collection.kind}</span>
				</a>
			</li>
		{/each}
	</ul>
</section>
