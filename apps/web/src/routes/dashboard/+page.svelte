<script lang="ts" module>
	const stats = [
		{ label: 'Published resources', value: 128, helper: '+12 this month' },
		{ label: 'Active collections', value: 24, helper: '6 awaiting review' },
		{ label: 'Unread engagement', value: 8, helper: 'Mentions, replies, likes' }
	];

	const recentResources = [
		['Composable auth flows', 'Draft', 'Updated 12m ago'],
		['D1 migration playbook', 'Published', 'Updated 2h ago'],
		['Workspace onboarding checklist', 'Review', 'Updated yesterday']
	];
</script>

<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
</script>

<svelte:head>
	<title>Dashboard · Vesta</title>
</svelte:head>

<div class="grid auto-rows-min gap-4 md:grid-cols-3">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between gap-4">
			<div>
				<Card.Title>Recent resources</Card.Title>
				<Card.Description>Drafts and published content that need attention.</Card.Description>
			</div>
			<Button size="sm">New resource</Button>
		</Card.Header>
		<Card.Content class="grid gap-3">
			{#each recentResources as [title, status, updated] (title)}
				<a
					href="/dashboard/resources"
					class="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{title}</p>
						<p class="text-xs text-muted-foreground">{updated}</p>
					</div>
					<Badge variant="secondary">{status}</Badge>
				</a>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Next slices</Card.Title>
			<Card.Description>Dashboard issue surfaces queued after the shell.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2 text-sm">
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard/settings/workspace">
				Workspace switcher and settings
			</a>
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard/resources">
				Resources list and editor
			</a>
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard/collections">
				Collections list and editor
			</a>
		</Card.Content>
	</Card.Root>
</div>
