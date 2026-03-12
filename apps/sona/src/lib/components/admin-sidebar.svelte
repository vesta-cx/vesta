<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import * as Avatar from '@vesta-cx/ui/components/ui/avatar';
	import * as DropdownMenu from '@vesta-cx/ui/components/ui/dropdown-menu';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import { useSidebar } from '@vesta-cx/ui/components/ui/sidebar';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import SmartphoneIcon from '@lucide/svelte/icons/smartphone';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import CameraIcon from '@lucide/svelte/icons/camera';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import TableIcon from '@lucide/svelte/icons/table';
	import ScaleIcon from '@lucide/svelte/icons/scale';
	import EggIcon from '@lucide/svelte/icons/egg';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import { SITE_NAME } from '$lib/constants/identity';

	interface Props {
		email: string;
		profilePictureUrl?: string;
	}

	let { email, profilePictureUrl }: Props = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboardIcon },
		{ href: '/admin/devices', label: 'Devices', icon: SmartphoneIcon },
		{ href: '/admin/sources', label: 'Sources', icon: FolderIcon },
		{ href: '/admin/quality-options', label: 'Quality Options', icon: SlidersHorizontalIcon },
		{ href: '/admin/easter-eggs', label: 'Easter Eggs', icon: EggIcon },
		{ href: '/admin/snapshots', label: 'Snapshots', icon: CameraIcon },
		{ href: '/admin/storage', label: 'R2 Storage', icon: DatabaseIcon },
		{ href: '/admin/db', label: 'Database', icon: TableIcon },
		{ href: '/admin/pairing-weights', label: 'Pairing Weights', icon: ScaleIcon }
	];

	const isActive = (href: string) =>
		href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);

	// Avatar fallback: first two chars of email (before @) or "AD"
	const initials = $derived(
		email.includes('@')
			? email.split('@')[0].slice(0, 2).toUpperCase()
			: email.slice(0, 2).toUpperCase() || 'AD'
	);

	const sidebar = useSidebar();
</script>

<Sidebar.Root collapsible="icon">
	<!-- Header: team-switcher style, no dropdown -->
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<a
					href="/admin"
					class="flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm ring-sidebar-ring transition-colors group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
				>
					<div
						class="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
					>
						<LayoutDashboardIcon class="size-4" />
					</div>
					<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
						<span class="truncate font-medium">Admin</span>
						<span class="truncate text-xs text-muted-foreground">{email}</span>
					</div>
				</a>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		<Sidebar.Group>
			<Sidebar.GroupLabel>{SITE_NAME}</Sidebar.GroupLabel>
			<Sidebar.Menu>
				{#each navItems as item}
					{#snippet linkChild({ props })}
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
		<!-- Nav-user style popover: avatar, email, logout, back to site -->
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<Avatar.Root class="size-8 shrink-0 rounded-lg">
									{#if profilePictureUrl}
										<Avatar.Image src={profilePictureUrl} alt="" class="rounded-lg" />
									{/if}
									<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
									<span class="truncate font-medium">{email.split('@')[0]}</span>
									<span class="truncate text-xs text-muted-foreground">{email}</span>
								</div>
								<ChevronsUpDownIcon class="ms-auto size-4 shrink-0" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenu.Label class="p-0 font-normal">
							<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
								<Avatar.Root class="size-8 shrink-0 rounded-lg">
									{#if profilePictureUrl}
										<Avatar.Image src={profilePictureUrl} alt="" class="rounded-lg" />
									{/if}
									<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
								</Avatar.Root>
								<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
									<span class="truncate font-medium">{email.split('@')[0]}</span>
									<span class="truncate text-xs text-muted-foreground">{email}</span>
								</div>
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<a
								href="/auth/logout"
								data-sveltekit-reload
								class="flex w-full cursor-pointer items-center gap-2 no-underline"
							>
								<LogOutIcon class="size-4" />
								Log out
							</a>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item
							onclick={() => goto('/')}
							class="flex cursor-pointer items-center gap-2 text-muted-foreground"
						>
							← Back to site
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
