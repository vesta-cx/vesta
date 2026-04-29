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
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MusicIcon from '@lucide/svelte/icons/music';
	import SectionHeader from './section-header.svelte';
	import Stat from './stat.svelte';
</script>

<SectionHeader
	title="Analytics"
	description="Workspace-wide signal across releases, campaigns, collections, and community."
/>

<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<Stat label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<Separator />

<section class="space-y-3">
	<header class="space-y-1">
		<h2 class="text-base font-medium">Sections</h2>
		<p class="text-sm text-muted-foreground">Jump into any surface.</p>
	</header>
	<ul class="-mx-2 grid">
		{#each sections as section (section.title)}
			<li>
				<a
					href={section.href}
					class="group/section flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
				>
					<div class="grid gap-0.5">
						<span class="text-sm font-medium">{section.title}</span>
						<span class="text-xs text-muted-foreground">{section.summary}</span>
					</div>
					<ArrowRightIcon
						class="size-4 text-muted-foreground transition-transform group-hover/section:translate-x-0.5"
					/>
				</a>
			</li>
		{/each}
	</ul>
</section>

<Separator />

<div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
	<section class="space-y-3">
		<header class="flex items-end justify-between gap-4">
			<div class="space-y-1">
				<h2 class="text-base font-medium">Drafts &amp; scheduled posts</h2>
				<p class="text-sm text-muted-foreground">Campaign content awaiting publish.</p>
			</div>
			<Button size="sm" variant="outline" href="/dashboard/resources/posts">
				<MegaphoneIcon class="size-4" /> New post
			</Button>
		</header>
		<ul class="-mx-2 grid">
			{#each drafts as draft (draft.title)}
				<li>
					<a
						href="/dashboard/resources/posts"
						class="flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
					>
						<div class="min-w-0">
							<p class="truncate text-sm font-medium">{draft.title}</p>
							<p class="text-xs text-muted-foreground">{draft.updated}</p>
						</div>
						<span class="shrink-0 text-xs text-muted-foreground">{draft.status}</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">Upcoming releases</h2>
			<p class="text-sm text-muted-foreground">Next two slots on the calendar.</p>
		</header>
		<ul class="-mx-2 grid">
			{#each upcoming as release (release.title)}
				<li>
					<a
						href="/dashboard/resources/releases"
						class="grid gap-0.5 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
					>
						<div class="flex items-center justify-between gap-2">
							<p class="truncate text-sm font-medium">{release.title}</p>
							<span class="shrink-0 text-xs text-muted-foreground">{release.when}</span>
						</div>
						<p class="text-xs text-muted-foreground">{release.subtitle}</p>
					</a>
				</li>
			{/each}
		</ul>
		<Button size="sm" variant="outline" class="gap-2" href="/dashboard/resources/releases">
			<MusicIcon class="size-4" /> Plan a release
		</Button>
	</section>
</div>
