<script lang="ts" module>
	const stats = [
		{ label: 'Followers', value: '2,418', helper: '+134 in last 30d' },
		{ label: 'Mentions · 30d', value: 38, helper: '12 require a reply' },
		{ label: 'Inbox · open', value: 8, helper: 'unanswered messages' }
	];

	const inbox = [
		{
			from: 'Lina W.',
			handle: '@linawrites',
			subject: 'Tour interview — sound check?',
			when: '12m ago'
		},
		{ from: 'Quiet Sun', handle: '@quietsun', subject: 'Mention on the EP post', when: '2h ago' },
		{ from: 'Daven F.', handle: '@daven', subject: 'Repost permission?', when: 'yesterday' }
	];

	const topFollowers = [
		{ name: 'Tess Marin', signal: 'reposted twice this week' },
		{ name: 'Quiet Sun', signal: 'mentioned in 3 posts' },
		{ name: 'Lina W.', signal: 'long-time follower · supporter' }
	];
</script>

<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
</script>

<svelte:head>
	<title>Community · Vesta</title>
</svelte:head>

<SectionHeader
	title="Community"
	description="Followers, mentions, and replies across linked profiles."
>
	{#snippet actions()}
		<Button size="sm" variant="outline" href="/dashboard/community/followers">
			Followers
		</Button>
		<Button size="sm" href="/dashboard/community/inbox">Open inbox</Button>
	{/snippet}
</SectionHeader>

<div class="grid auto-rows-min gap-4 md:grid-cols-3">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>Inbox · needs a response</Card.Title>
			<Card.Description>Open conversations from fans, peers, and press.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each inbox as message (message.subject)}
				<a
					href="/dashboard/community/inbox"
					class="grid gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<div class="flex items-center justify-between gap-2 text-sm">
						<span class="font-medium">{message.from}</span>
						<span class="text-xs text-muted-foreground">{message.when}</span>
					</div>
					<p class="text-sm">{message.subject}</p>
					<p class="text-xs text-muted-foreground">{message.handle}</p>
				</a>
			{/each}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Recent supporters</Card.Title>
			<Card.Description>Followers driving the most engagement lately.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each topFollowers as follower (follower.name)}
				<div class="grid gap-0.5 rounded-lg border p-3">
					<p class="text-sm font-medium">{follower.name}</p>
					<p class="text-xs text-muted-foreground">{follower.signal}</p>
				</div>
			{/each}
		</Card.Content>
	</Card.Root>
</div>
