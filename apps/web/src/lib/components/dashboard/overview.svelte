<script lang="ts" module>
	const stats = [
		{ label: 'Smart-link clicks · 30d', value: '4,287', helper: '+18% vs prev. 30d' },
		{ label: 'Pre-saves · open', value: 612, helper: 'Tidewater EP · live' },
		{ label: 'New followers · 30d', value: 134, helper: 'across linked profiles' },
		{ label: 'Workspace health', value: '88%', helper: 'bio + links + cover art' }
	];

	const sections = [
		{
			title: 'Resources',
			href: '/dashboard/resources',
			summary: '86 resources · 12 drafts · 6 released this month'
		},
		{
			title: 'Campaigns',
			href: '/dashboard/campaigns',
			summary: '3 active · 1 launching this week · 612 pre-saves open'
		},
		{
			title: 'Collections',
			href: '/dashboard/collections',
			summary: '14 collections · 218 items · last edit 2h ago'
		},
		{
			title: 'Community',
			href: '/dashboard/community',
			summary: '2,418 followers · 38 mentions · 8 inbox open'
		}
	];

	const upcoming = [
		{ title: 'Tidewater EP', subtitle: 'Album · pre-save live', when: 'May 9' },
		{ title: 'Lantern (single)', subtitle: 'Quiet Sun · drafting', when: 'May 16' }
	];

	const drafts = [
		{ title: 'Announcement post — Tidewater', status: 'Scheduled', updated: 'Sends Apr 30' },
		{ title: 'Behind the cover art', status: 'Draft', updated: 'Updated 2h ago' },
		{ title: 'Tour dates 2026', status: 'Draft', updated: 'Updated yesterday' }
	];
</script>

<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MusicIcon from '@lucide/svelte/icons/music';
	import SectionHeader from './section-header.svelte';
</script>

<SectionHeader
	title="Analytics"
	description="Workspace-wide signal across releases, campaigns, collections, and community."
/>

<div class="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each sections as section (section.title)}
		<a
			href={section.href}
			class="group/section flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium">{section.title}</span>
				<ArrowRightIcon
					class="size-4 text-muted-foreground transition-transform group-hover/section:translate-x-0.5"
				/>
			</div>
			<p class="text-xs text-muted-foreground">{section.summary}</p>
		</a>
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
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

	<Card.Root>
		<Card.Header>
			<Card.Title>Upcoming releases</Card.Title>
			<Card.Description>Next two slots on the calendar.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each upcoming as release (release.title)}
				<a
					href="/dashboard/resources/releases"
					class="grid gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<div class="flex items-center justify-between gap-2">
						<p class="truncate text-sm font-medium">{release.title}</p>
						<span class="shrink-0 text-xs font-medium text-muted-foreground">
							{release.when}
						</span>
					</div>
					<p class="text-xs text-muted-foreground">{release.subtitle}</p>
				</a>
			{/each}
			<Button
				size="sm"
				variant="outline"
				class="mt-1 justify-start gap-2"
				href="/dashboard/resources/releases"
			>
				<MusicIcon class="size-4" /> Plan a release
			</Button>
		</Card.Content>
	</Card.Root>
</div>
