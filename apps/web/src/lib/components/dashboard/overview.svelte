<script lang="ts" module>
	const stats = [
		{ label: 'Smart-link clicks · 30d', value: '4,287', helper: '+18% vs prev. 30d' },
		{ label: 'Pre-saves · open', value: 612, helper: 'Tidewater EP · live' },
		{ label: 'New followers · 30d', value: 134, helper: 'Across linked profiles' },
		{ label: 'Workspace health', value: '88%', helper: 'Bio + links + cover art' }
	];

	const upcoming = [
		{ title: 'Tidewater EP', subtitle: 'Album · pre-save live', when: 'May 9' },
		{ title: 'Tidewater · single edit', subtitle: 'Promo single · drafting', when: 'Jun 6' }
	];

	const drafts = [
		{ title: 'Announcement post — Tidewater', status: 'Scheduled', updated: 'Sends Apr 30' },
		{ title: 'Behind the cover art', status: 'Draft', updated: 'Updated 2h ago' },
		{ title: 'Tour dates 2026', status: 'Draft', updated: 'Updated yesterday' }
	];

	const platformPerformance = [
		{ name: 'Spotify', clicks: 1842, share: 0.43 },
		{ name: 'Apple Music', clicks: 1109, share: 0.26 },
		{ name: 'Bandcamp', clicks: 612, share: 0.14 },
		{ name: 'YouTube Music', clicks: 412, share: 0.1 },
		{ name: 'Tidal', clicks: 312, share: 0.07 }
	];
</script>

<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MusicIcon from '@lucide/svelte/icons/music';
</script>

<div class="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header class="flex flex-row items-center justify-between gap-4">
			<div class="space-y-1">
				<Card.Title>Smart-link routing · last 30 days</Card.Title>
				<Card.Description>Where fans land when they hit your release page.</Card.Description>
			</div>
			<Button size="sm" variant="outline" href="/dashboard/community">View community</Button>
		</Card.Header>
		<Card.Content class="grid gap-3">
			{#each platformPerformance as platform (platform.name)}
				<div class="grid gap-1.5">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium">{platform.name}</span>
						<span class="text-muted-foreground">
							{platform.clicks.toLocaleString()} clicks · {Math.round(platform.share * 100)}%
						</span>
					</div>
					<div class="h-2 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-foreground/85"
							style:width="{Math.round(platform.share * 100)}%"
						></div>
					</div>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Upcoming releases</Card.Title>
			<Card.Description>Next two slots on the calendar.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each upcoming as release (release.title)}
				<a
					href="/dashboard/resources/releases"
					class="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{release.title}</p>
						<p class="text-xs text-muted-foreground">{release.subtitle}</p>
					</div>
					<span class="shrink-0 text-xs font-medium text-muted-foreground">{release.when}</span>
				</a>
			{/each}
			<Button
				size="sm"
				class="mt-1 justify-start gap-2"
				variant="outline"
				href="/dashboard/resources/releases"
			>
				<MusicIcon class="size-4" /> Plan a release
			</Button>
		</Card.Content>
	</Card.Root>
</div>

<Card.Root>
	<Card.Header class="flex flex-row items-center justify-between gap-4">
		<div class="space-y-1">
			<Card.Title>Drafts &amp; scheduled posts</Card.Title>
			<Card.Description>Campaign content awaiting publish.</Card.Description>
		</div>
		<Button size="sm" href="/dashboard/resources/posts">
			<MegaphoneIcon class="size-4" /> New post
		</Button>
	</Card.Header>
	<Card.Content class="grid gap-2">
		{#each drafts as draft (draft.title)}
			<a
				href="/dashboard/resources/posts"
				class="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
			>
				<div class="min-w-0">
					<p class="truncate text-sm font-medium">{draft.title}</p>
					<p class="text-xs text-muted-foreground">{draft.updated}</p>
				</div>
				<Badge variant="secondary">{draft.status}</Badge>
			</a>
		{/each}
	</Card.Content>
</Card.Root>
