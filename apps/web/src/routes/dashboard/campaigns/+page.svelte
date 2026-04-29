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
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import LinkIcon from '@lucide/svelte/icons/link';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
	import Stat from '$lib/components/dashboard/stat.svelte';
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

<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<Stat label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<Separator />

<div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">Smart-link routing · 30d</h2>
			<p class="text-sm text-muted-foreground">
				Platform share for fans hitting your release pages.
			</p>
		</header>
		<div class="grid gap-3">
			{#each platformPerformance as platform (platform.name)}
				<div class="grid gap-1.5">
					<div class="flex items-center justify-between text-sm">
						<span class="font-medium">{platform.name}</span>
						<span class="text-muted-foreground">
							{platform.clicks.toLocaleString()} · {Math.round(platform.share * 100)}%
						</span>
					</div>
					<div class="h-1.5 overflow-hidden rounded-full bg-muted">
						<div
							class="h-full rounded-full bg-foreground/85"
							style:width="{Math.round(platform.share * 100)}%"
						></div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">Active campaigns</h2>
			<p class="text-sm text-muted-foreground">Where energy is going this week.</p>
		</header>
		<ul class="-mx-2 grid">
			{#each campaigns as campaign (campaign.title)}
				<li>
					<a
						href="/dashboard/campaigns/smart-links"
						class="grid gap-0.5 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
					>
						<div class="flex items-center justify-between gap-2">
							<p class="truncate text-sm font-medium">{campaign.title}</p>
							<span class="shrink-0 text-xs text-muted-foreground">{campaign.status}</span>
						</div>
						<p class="text-xs text-muted-foreground">
							{campaign.release}
							{#if campaign.signups > 0}
								· {campaign.signups} signups
							{/if}
						</p>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
