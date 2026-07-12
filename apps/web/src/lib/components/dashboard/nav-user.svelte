<script lang="ts" module>
	export type DashboardUser = {
		/** WorkOS legal name. */
		name: string;
		email: string;
		emailVerified: boolean;
		firstName: string;
		lastName: string;
		avatarUrl?: string;
		/** Vesta-owned public display name. */
		displayName: string;
		/** Vesta-owned handle; null when the user hasn't picked one yet. */
		handle: string | null;
		/** Vesta-owned bio. */
		bio: string | null;
	};

	export type DashboardSecurity = {
		unavailable: boolean;
		authFactors: import('@vesta-cx/auth').AuthFactor[];
		sessions: import('@vesta-cx/auth').AuthUserSession[];
		currentSessionId: string | null;
	};
</script>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import * as Avatar from '@vesta-cx/ui/components/ui/avatar';
	import * as DropdownMenu from '@vesta-cx/ui/components/ui/dropdown-menu';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import { useSidebar } from '@vesta-cx/ui/components/ui/sidebar';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { IN_DEVELOPMENT_TOOLTIP } from './nav-collapsible.svelte';

	let { user }: { user: DashboardUser } = $props();

	const sidebar = useSidebar();
	const displayName = $derived(user.displayName);
	const handleLine = $derived(user.handle ? `@${user.handle}` : user.email);

	const initials = $derived(
		displayName
			.split(/\s+/)
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase() || displayName.slice(0, 2).toUpperCase()
	);

	const openSettings = async () => {
		const nextUrl = new URL(page.url);
		nextUrl.searchParams.set('settings', 'profile');
		await goto(nextUrl, { keepFocus: true, noScroll: true });
	};
</script>

{#snippet identity()}
	<Avatar.Root class="size-8 rounded-lg">
		{#if user.avatarUrl}
			<Avatar.Image src={user.avatarUrl} alt={displayName} class="rounded-lg" />
		{/if}
		<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
	</Avatar.Root>
	<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
		<span class="truncate font-medium">{displayName}</span>
		<span class="truncate text-xs text-muted-foreground">{handleLine}</span>
	</div>
{/snippet}

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props }: { props?: Record<string, unknown> })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						{@render identity()}
						<ChevronsUpDownIcon class="ms-auto size-4" />
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
						{@render identity()}
					</div>
				</DropdownMenu.Label>

				<DropdownMenu.Separator />

				<DropdownMenu.Group>
					<DropdownMenu.Item disabled title={IN_DEVELOPMENT_TOOLTIP}>
						<UserRoundIcon />
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Item onSelect={() => void openSettings()}>
						<SettingsIcon />
						Settings
					</DropdownMenu.Item>
					<DropdownMenu.Item disabled title={IN_DEVELOPMENT_TOOLTIP}>
						<HelpCircleIcon />
						Help &amp; support
					</DropdownMenu.Item>
				</DropdownMenu.Group>

				<DropdownMenu.Separator />

				<DropdownMenu.Item>
					{#snippet child({ props }: { props?: Record<string, unknown> })}
						<a href="/" {...props}>
							<ArrowLeftIcon />
							Back to Vesta
						</a>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item>
					{#snippet child({ props }: { props?: Record<string, unknown> })}
						<a href="/auth/logout" {...props}>
							<LogOutIcon />
							Log out
						</a>
					{/snippet}
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
