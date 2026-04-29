<script lang="ts" module>
	const stats = [
		{ label: 'Smart-link clicks · 30d', value: '4,287', helper: '+18% vs prev. 30d' },
		{ label: 'Pre-saves · open', value: 612, helper: 'Tidewater EP · live' },
		{ label: 'Active campaigns', value: 3, helper: '1 launching this week' },
		{ label: 'CTR · pre-save → save', value: '24%', helper: 'rolling 14-day window' }
	];

	const platformPerformance = [
		{ name: 'Spotify', clicks: 1842, share: 0.43 },
		{ name: 'Apple Music', clicks: 1109, share: 0.26 },
		{ name: 'Bandcamp', clicks: 612, share: 0.14 },
		{ name: 'YouTube Music', clicks: 412, share: 0.1 },
		{ name: 'Tidal', clicks: 312, share: 0.07 }
	];

	const campaigns = [
		{
			title: 'Tidewater EP · pre-save',
			release: 'Hollow Coast · May 9',
			status: 'Live',
			signups: 612
		},
		{
			title: 'Heat · platform push',
			release: 'Ardo · Apr 25',
			status: 'Live',
			signups: 408
		},
		{
			title: 'Lantern · pre-save',
			release: 'Quiet Sun · May 16',
			status: 'Drafting',
			signups: 0
		}
	];
</script>

<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import LinkIcon from '@lucide/svelte/icons/link';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
</script>

<svelte:head>
	<title>Campaigns · Vesta</title>
</svelte:head>

<SectionHeader
	title="Campaigns"
	description="Smart links, pre-saves, and the rollouts that route fans to releases."
>
	{#snippet actions()}
		<Button size="sm" variant="outline" href="/dashboard/campaigns/pre-saves">
			Pre-saves
		</Button>
		<Button size="sm" href="/dashboard/campaigns/smart-links">
			<LinkIcon class="size-4" /> New smart link
		</Button>
	{/snippet}
</SectionHeader>

<div class="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>Smart-link routing · last 30 days</Card.Title>
			<Card.Description>Platform share for fans hitting your release pages.</Card.Description>
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
			<Card.Title>Active campaigns</Card.Title>
			<Card.Description>Where energy is going this week.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each campaigns as campaign (campaign.title)}
				<a
					href="/dashboard/campaigns/smart-links"
					class="grid gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<div class="flex items-center justify-between gap-2">
						<p class="truncate text-sm font-medium">{campaign.title}</p>
						<Badge variant={campaign.status === 'Live' ? 'default' : 'secondary'}>
							{campaign.status}
						</Badge>
					</div>
					<p class="text-xs text-muted-foreground">
						{campaign.release}
						{#if campaign.signups > 0}
							· {campaign.signups} signups
						{/if}
					</p>
				</a>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
