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
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import SectionHeader from '$lib/components/dashboard/section-header.svelte';
	import Stat from '$lib/components/dashboard/stat.svelte';
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

<div class="grid gap-6 md:grid-cols-3">
	{#each stats as stat (stat.label)}
		<Stat label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<Separator />

<div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">Inbox · needs a response</h2>
			<p class="text-sm text-muted-foreground">
				Open conversations from fans, peers, and press.
			</p>
		</header>
		<ul class="-mx-2 grid">
			{#each inbox as message (message.subject)}
				<li>
					<a
						href="/dashboard/community/inbox"
						class="grid gap-0.5 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
					>
						<div class="flex items-center justify-between gap-2 text-sm">
							<span class="font-medium">{message.from}</span>
							<span class="text-xs text-muted-foreground">{message.when}</span>
						</div>
						<p class="text-sm">{message.subject}</p>
						<p class="text-xs text-muted-foreground">{message.handle}</p>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="space-y-3">
		<header class="space-y-1">
			<h2 class="text-base font-medium">Recent supporters</h2>
			<p class="text-sm text-muted-foreground">
				Followers driving the most engagement lately.
			</p>
		</header>
		<ul class="-mx-2 grid">
			{#each topFollowers as follower (follower.name)}
				<li class="grid gap-0.5 px-2 py-3">
					<p class="text-sm font-medium">{follower.name}</p>
					<p class="text-xs text-muted-foreground">{follower.signal}</p>
				</li>
			{/each}
		</ul>
	</section>
</div>
