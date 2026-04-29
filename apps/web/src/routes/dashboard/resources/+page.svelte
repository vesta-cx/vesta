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
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import * as Table from '@vesta-cx/ui/components/ui/table';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
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

<div class="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>Top performing resources · 30d</Card.Title>
			<Card.Description>Ranked by smart-link clicks.</Card.Description>
		</Card.Header>
		<Card.Content class="px-0">
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
							<Table.Cell class="text-end">
								<Badge variant="secondary">{row.status}</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Recent activity</Card.Title>
			<Card.Description>Latest edits across drafts and published items.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each recentActivity as row (row.title)}
				<a
					href="/dashboard/resources"
					class="grid gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<p class="text-sm font-medium">{row.title}</p>
					<p class="text-xs text-muted-foreground">{row.kind} · {row.when}</p>
				</a>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
