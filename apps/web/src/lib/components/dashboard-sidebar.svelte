<script lang="ts" module>
	import BookMarkedIcon from '@lucide/svelte/icons/book-marked';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import FolderKanbanIcon from '@lucide/svelte/icons/folder-kanban';
	import HomeIcon from '@lucide/svelte/icons/house';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';

	const navItems = [
		{ href: '/dashboard', label: 'Overview', icon: HomeIcon },
		{ href: '/dashboard/resources', label: 'Resources', icon: FileTextIcon },
		{ href: '/dashboard/collections', label: 'Collections', icon: FolderKanbanIcon },
		{ href: '/dashboard/engagement', label: 'Engagement', icon: InboxIcon },
		{ href: '/dashboard/settings/workspace', label: 'Workspace settings', icon: SettingsIcon },
		{ href: '/dashboard/settings/account', label: 'User settings', icon: UserRoundIcon }
	];
</script>

<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';

	const isActive = (href: string) =>
		href === '/dashboard'
			? page.url.pathname === '/dashboard'
			: page.url.pathname.startsWith(href);
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg" tooltipContent="Vesta dashboard">
					{#snippet child({ props }: { props?: Record<string, unknown> })}
						<a href="/dashboard" {...props}>
							<div
								class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
							>
								<LayoutDashboardIcon class="size-4" />
							</div>
							<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
								<span class="truncate font-medium">Vesta</span>
								<span class="truncate text-xs text-muted-foreground">Dashboard</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
			<Sidebar.Menu>
				{#each navItems as item (item.href)}
					{#snippet linkChild({ props }: { props?: Record<string, unknown> })}
						<a href={item.href} {...props}>
							<item.icon />
							<span>{item.label}</span>
						</a>
					{/snippet}

					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							tooltipContent={item.label}
							isActive={isActive(item.href)}
							child={linkChild}
						/>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Group>
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent="New resource">
					<BookMarkedIcon />
					<span>New resource</span>
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
