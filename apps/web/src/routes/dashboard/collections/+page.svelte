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
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
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

<div class="grid auto-rows-min gap-4 md:grid-cols-3">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<Card.Root>
	<Card.Header>
		<Card.Title>Recent collections</Card.Title>
		<Card.Description>What's been edited or added to lately.</Card.Description>
	</Card.Header>
	<Card.Content class="grid gap-2 md:grid-cols-2">
		{#each collections as collection (collection.title)}
			<a
				href="/dashboard/collections"
				class="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
			>
				<div class="min-w-0">
					<p class="truncate text-sm font-medium">{collection.title}</p>
					<p class="text-xs text-muted-foreground">
						{collection.count} items · updated {collection.updated}
					</p>
				</div>
				<Badge variant="secondary">{collection.kind}</Badge>
			</a>
		{/each}
	</Card.Content>
</Card.Root>
