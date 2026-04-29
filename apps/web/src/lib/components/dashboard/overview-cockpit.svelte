<script lang="ts" module>
	import { featuredRelease, upcomingMilestones } from './data.js';

	const releaseDate = new Date(featuredRelease.releaseDate);

	const presaves = { count: 612, goal: 1000 };

	const platformLinks = featuredRelease.platforms;

	const recentPosts = [
		{ title: 'Cover art reveal', when: 'Sent · 2d ago', engagements: '128 reactions' },
		{ title: 'Studio diary #3', when: 'Sent · 6d ago', engagements: '92 reactions' }
	];

	const audienceMomentum = [
		{ source: 'Pre-save link', signups: 412 },
		{ source: 'Profile follow', signups: 138 },
		{ source: 'Mailing list', signups: 62 }
	];
</script>

<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import { Progress } from '@vesta-cx/ui/components/ui/progress';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import LinkIcon from '@lucide/svelte/icons/link';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MusicIcon from '@lucide/svelte/icons/music';

	const daysUntil = Math.max(
		0,
		Math.round((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
	);
	const presaveShare = Math.min(100, Math.round((presaves.count / presaves.goal) * 100));
	const formattedDate = releaseDate.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric'
	});
</script>

<Card.Root class="overflow-hidden border-0 shadow-none">
	<div class="grid gap-0 lg:grid-cols-[18rem_1fr]">
		<div
			class="aspect-square w-full lg:aspect-auto"
			style:background={featuredRelease.coverGradient}
		></div>
		<div class="flex flex-col justify-between gap-6 p-6">
			<div class="space-y-2">
				<div class="flex items-center gap-2">
					<Badge variant="secondary">{featuredRelease.type}</Badge>
					<Badge variant="outline" class="gap-1">
						<CalendarClockIcon class="size-3" />
						{daysUntil} days out
					</Badge>
				</div>
				<h1 class="text-3xl font-semibold tracking-tight md:text-4xl">
					{featuredRelease.title}
				</h1>
				<p class="text-sm text-muted-foreground">
					{featuredRelease.artist} · releases {formattedDate}
				</p>
			</div>

			<div class="grid gap-2">
				<div class="flex items-baseline justify-between text-sm">
					<span class="font-medium">Pre-saves</span>
					<span class="text-muted-foreground">
						<span class="text-foreground">{presaves.count.toLocaleString()}</span> /
						{presaves.goal.toLocaleString()} goal
					</span>
				</div>
				<Progress value={presaveShare} />
			</div>

			<div class="flex flex-wrap gap-2">
				<Button size="sm" href="/dashboard-3/smart-links">
					<LinkIcon class="size-4" /> Edit smart link
				</Button>
				<Button size="sm" variant="outline" href="/dashboard-3/posts">
					<MegaphoneIcon class="size-4" /> Schedule announcement
				</Button>
				<Button size="sm" variant="outline" href="/dashboard-3/releases">
					<MusicIcon class="size-4" /> Open release page
				</Button>
			</div>
		</div>
	</div>
</Card.Root>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>Campaign timeline</Card.Title>
			<Card.Description>Everything queued for this rollout.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-3">
			{#each upcomingMilestones as milestone, index (milestone.label)}
				<div class="flex items-start gap-3">
					<div
						class="mt-0.5 flex size-8 items-center justify-center rounded-full border bg-background"
					>
						<milestone.icon class="size-4" />
					</div>
					<div class="grid flex-1 gap-0.5">
						<p class="text-sm font-medium">{milestone.label}</p>
						<p class="text-xs text-muted-foreground">{milestone.when}</p>
					</div>
				</div>
				{#if index < upcomingMilestones.length - 1}
					<Separator />
				{/if}
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Smart-link routes</Card.Title>
			<Card.Description>Where pre-save fans get sent on release day.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2 text-sm">
			{#each platformLinks as platform (platform)}
				<div class="flex items-center justify-between gap-3 rounded-lg border p-3">
					<span>{platform}</span>
					<span class="text-xs text-muted-foreground">configured</span>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>

<div class="grid gap-4 md:grid-cols-2">
	<Card.Root>
		<Card.Header class="flex flex-row items-center justify-between gap-4">
			<div class="space-y-1">
				<Card.Title>Recent campaign posts</Card.Title>
				<Card.Description>Engagement on the announcements you've sent.</Card.Description>
			</div>
			<Button size="sm" variant="outline" href="/dashboard-3/posts">All posts</Button>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each recentPosts as post (post.title)}
				<a
					href="/dashboard-3/posts"
					class="grid gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<p class="text-sm font-medium">{post.title}</p>
					<p class="text-xs text-muted-foreground">{post.when} · {post.engagements}</p>
				</a>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Audience momentum</Card.Title>
			<Card.Description>New signups attributed to this campaign.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-3 text-sm">
			{#each audienceMomentum as row (row.source)}
				<div class="flex items-center justify-between">
					<span>{row.source}</span>
					<span class="font-medium">+{row.signups}</span>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
