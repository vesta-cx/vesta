<script lang="ts" module>
	const stats = [
		{ label: 'Total resources', value: 86, helper: '32 releases · 54 posts' },
		{ label: 'Drafts', value: 12, helper: '4 scheduled' },
		{ label: 'Released this month', value: 6, helper: 'across 2 artists' },
		{ label: 'Avg. clicks per release', value: '342', helper: 'rolling 30-day window' }
	];

	const topPerformers = [
		{ title: 'Tidewater EP', kind: 'Album', clicks: 1842, status: 'Live' },
		{ title: 'Heat (single)', kind: 'Single', clicks: 1109, status: 'Live' },
		{ title: 'Cover art reveal', kind: 'Post', clicks: 612, status: 'Published' },
		{ title: 'Lantern (single)', kind: 'Single', clicks: 412, status: 'Pre-save live' }
	];

	const recentActivity = [
		{ title: 'Tour dates 2026', kind: 'Post draft', when: 'Updated 12m ago' },
		{ title: 'Glasshouse — track 4 demo', kind: 'Song draft', when: 'Updated 2h ago' },
		{ title: 'Behind the cover art', kind: 'Post', when: 'Updated yesterday' }
	];
</script>

<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import * as Table from '@vesta-cx/ui/components/ui/table';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
	import Stat from '$lib/components/dashboard/stat.svelte';
</script>

<svelte:head>
	<title>Resources · Vesta</title>
</svelte:head>

<SectionHeader
	title="Resources"
	description="Songs, albums, and posts authored in this workspace."
>
	{#snippet actions()}
		<Button size="sm" variant="outline" href="/dashboard/resources/drafts">View drafts</Button>
		<Button size="sm" href="/dashboard/resources/releases">New release</Button>
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
			<h2 class="text-base font-medium">Top performing · 30d</h2>
			<p class="text-sm text-muted-foreground">Ranked by smart-link clicks.</p>
		</header>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Resource</Table.Head>
					<Table.Head>Type</Table.Head>
					<Table.Head class="text-end">Clicks</Table.Head>
					<Table.Head class="text-end">Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each topPerformers as row (row.title)}
					<Table.Row>
						<Table.Cell class="font-medium">{row.title}</Table.Cell>
						<Table.Cell class="text-muted-foreground">{row.kind}</Table.Cell>
						<Table.Cell class="text-end">{row.clicks.toLocaleString()}</Table.Cell>
						<Table.Cell class="text-end text-muted-foreground">{row.status}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</section>

	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">Recent activity</h2>
			<p class="text-sm text-muted-foreground">Latest edits across drafts and published items.</p>
		</header>
		<ul class="-mx-2 grid">
			{#each recentActivity as row (row.title)}
				<li>
					<a
						href="/dashboard/resources"
						class="grid gap-0.5 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
					>
						<p class="text-sm font-medium">{row.title}</p>
						<p class="text-xs text-muted-foreground">{row.kind} · {row.when}</p>
					</a>
				</li>
			{/each}
		</ul>
	</section>
</div>
