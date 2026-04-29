<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import CalendarClockIcon from '@lucide/svelte/icons/calendar-clock';
	import {
		cockpitNav,
		dashboardUser,
		featuredRelease,
		utilityNav
	} from './data.js';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';

	// Variant C — campaign cockpit. Sidebar collapses around the release in flight
	// instead of generic platform navigation. The "header" is the release itself.
	const releaseDate = new Date(featuredRelease.releaseDate);
	const daysUntil = Math.max(
		0,
		Math.round((releaseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
	);

	const isActive = (href: string) =>
		href === '/dashboard-3'
			? page.url.pathname === '/dashboard-3'
			: page.url.pathname.startsWith(href);
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header class="border-b group-data-[collapsible=icon]:border-b-0">
		<div
			class="flex items-center gap-3 rounded-lg p-2 group-data-[collapsible=icon]:p-0"
		>
			<div
				class="aspect-square size-10 shrink-0 rounded-md ring-1 ring-sidebar-border"
				style:background={featuredRelease.coverGradient}
				aria-hidden="true"
			></div>
			<div
				class="grid min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden"
			>
				<span class="truncate text-sm font-medium">{featuredRelease.title}</span>
				<span class="truncate text-xs text-muted-foreground">
					{featuredRelease.artist}
				</span>
				<span
					class="mt-1 inline-flex items-center gap-1 text-xs font-medium text-foreground"
				>
					<CalendarClockIcon class="size-3" />
					{daysUntil} days to release
				</span>
			</div>
		</div>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Campaign</Sidebar.GroupLabel>
			<Sidebar.Menu>
				{#each cockpitNav as item (item.title)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent={item.title}
							isActive={isActive(item.href)}
						>
							{#snippet child({ props }: { props?: Record<string, unknown> })}
								<a href={item.href} {...props}>
									<item.icon />
									<span>{item.title}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>

		<NavSecondary items={utilityNav} class="mt-auto" />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser user={dashboardUser} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
