<script lang="ts" module>
	import { rosterCalendar } from './data.js';

	const stats = [
		{ label: 'Active artists', value: 12, helper: '2 onboarding' },
		{ label: 'Releases · 90d', value: 18, helper: '4 in market' },
		{ label: 'Smart-link clicks · 30d', value: '38.4k', helper: '+22% vs prev. 30d' },
		{ label: 'Pre-saves · open', value: '2,140', helper: '6 active campaigns' }
	];

	const campaigns = [
		{ title: 'Tidewater EP · Hollow Coast', stage: 'Pre-save · 612', when: '12 days out' },
		{ title: 'Heat · Ardo', stage: 'Out · 4d ago', when: 'Continuing push' },
		{
			title: 'Glasshouse album · Tess Marin',
			stage: 'Drafting · cover art due',
			when: '38 days out'
		}
	];
</script>

<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import * as StatCard from '@vesta-cx/ui/components/ui/stat-card';
	import * as Table from '@vesta-cx/ui/components/ui/table';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import MegaphoneIcon from '@lucide/svelte/icons/megaphone';
	import MusicIcon from '@lucide/svelte/icons/music';
</script>

<div class="grid auto-rows-min gap-4 md:grid-cols-2 xl:grid-cols-4">
	{#each stats as stat (stat.label)}
		<StatCard.Root label={stat.label} value={stat.value} helper={stat.helper} />
	{/each}
</div>

<div class="grid gap-4 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header class="flex flex-row items-center justify-between gap-4">
			<div class="space-y-1">
				<Card.Title>Roster release calendar</Card.Title>
				<Card.Description>Releases across the label, ordered by date.</Card.Description>
			</div>
			<Button size="sm" href="/dashboard-2/releases">
				<MusicIcon class="size-4" /> Plan release
			</Button>
		</Card.Header>
		<Card.Content class="px-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Artist</Table.Head>
						<Table.Head>Release</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Date</Table.Head>
						<Table.Head class="text-end">Status</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each rosterCalendar as row (row.title)}
						<Table.Row>
							<Table.Cell class="font-medium">{row.artist}</Table.Cell>
							<Table.Cell>{row.title}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{row.releaseDate}</Table.Cell>
							<Table.Cell class="text-end">
								<Badge
									variant={row.status === 'Out'
										? 'outline'
										: row.status === 'Pre-save live'
											? 'default'
											: 'secondary'}
								>
									{row.status}
								</Badge>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Active campaigns</Card.Title>
			<Card.Description>Where the label is putting energy this week.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2">
			{#each campaigns as campaign (campaign.title)}
				<a
					href="/dashboard-2/campaigns"
					class="grid gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50"
				>
					<p class="text-sm font-medium">{campaign.title}</p>
					<p class="text-xs text-muted-foreground">{campaign.stage}</p>
					<p class="text-xs font-medium">{campaign.when}</p>
				</a>
			{/each}
		</Card.Content>
	</Card.Root>
</div>

<div class="grid gap-4 md:grid-cols-3">
	<Card.Root>
		<Card.Header>
			<Card.Title>Bring artists in</Card.Title>
			<Card.Description>Onboard new roster members in minutes.</Card.Description>
		</Card.Header>
		<Card.Content class="flex flex-col gap-2 text-sm">
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard-2/imports">
				Invite an artist by email
			</a>
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard-2/imports">
				Import an artist's existing pages
			</a>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Templates</Card.Title>
			<Card.Description>Reuse what works across artists.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-2 text-sm">
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard-2/campaigns">
				Single rollout · 4-week
			</a>
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard-2/campaigns">
				EP rollout · 8-week
			</a>
			<a class="rounded-lg border p-3 hover:bg-muted/50" href="/dashboard-2/campaigns">
				Pre-save + announcement combo
			</a>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>Audience growth</Card.Title>
			<Card.Description>Followers + pre-saves across all artists.</Card.Description>
		</Card.Header>
		<Card.Content class="grid gap-3 text-sm">
			<div class="flex items-center justify-between">
				<span>Hollow Coast</span>
				<span class="font-medium">+412</span>
			</div>
			<div class="flex items-center justify-between">
				<span>Tess Marin</span>
				<span class="font-medium">+318</span>
			</div>
			<div class="flex items-center justify-between">
				<span>Quiet Sun</span>
				<span class="font-medium">+201</span>
			</div>
			<div class="flex items-center justify-between text-muted-foreground">
				<span>9 others</span>
				<span>+540</span>
			</div>
		</Card.Content>
	</Card.Root>
</div>
