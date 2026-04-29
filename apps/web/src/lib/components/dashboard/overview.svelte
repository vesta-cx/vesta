<script lang="ts" module>
	const stats = [
		{ label: 'Published resources', value: 128, helper: '+12 this month' },
		{ label: 'Active collections', value: 24, helper: '6 awaiting review' },
		{ label: 'Unread engagement', value: 8, helper: 'Mentions, replies, likes' },
		{ label: 'Workspace health', value: '92%', helper: 'Permissions + content coverage' }
	];

	const recentResources = [
		{ title: 'Composable auth flows', status: 'Draft', updated: 'Updated 12m ago' },
		{ title: 'D1 migration playbook', status: 'Published', updated: 'Updated 2h ago' },
		{
			title: 'Workspace onboarding checklist',
			status: 'In review',
			updated: 'Updated yesterday'
		}
	];

	const queue = [
		{ title: 'Workspace switcher and settings', href: '/dashboard/settings/workspace' },
		{ title: 'Resources list and editor', href: '/dashboard/resources' },
		{ title: 'Collections list and editor', href: '/dashboard/collections' }
	];
</script>

<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
</script>

<div class="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between gap-4">
			<div class="space-y-1">
				<Card.Title>Recent resources</Card.Title>
				<Card.Description>Drafts and published content that need attention.</Card.Description>
			</div>
			<Button size="sm" href="/dashboard/resources">New resource</Button>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each recentResources as resource (resource.title)}
				<a
					href="/dashboard/resources"
					class="flex items-center justify-between gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium">{resource.title}</p>
						<p class="text-xs text-muted-foreground">{resource.updated}</p>
					</div>
					<Badge variant="secondary">{resource.status}</Badge>
				</a>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Next slices</Card.Title>
			<Card.Description>Dashboard surfaces queued after the shell.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2 text-sm">
			{#each queue as item (item.href)}
				<a
					href={item.href}
					class="rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					{item.title}
				</a>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
