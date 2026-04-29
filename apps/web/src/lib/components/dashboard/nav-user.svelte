<script lang="ts" module>
	export type DashboardUser = {
		name: string;
		email: string;
		avatarUrl?: string;
	};
</script>

<script lang="ts">
	import * as Avatar from '@vesta-cx/ui/components/ui/avatar';
	import * as DropdownMenu from '@vesta-cx/ui/components/ui/dropdown-menu';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import { useSidebar } from '@vesta-cx/ui/components/ui/sidebar';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import HelpCircleIcon from '@lucide/svelte/icons/help-circle';
	import LogOutIcon from '@lucide/svelte/icons/log-out';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';

	let { user }: { user: DashboardUser } = $props();

	const sidebar = useSidebar();
	const initials = $derived(
		user.name
			.split(/\s+/)
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase() || user.email.slice(0, 2).toUpperCase()
	);
</script>

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
						<Avatar.Root class="size-8 rounded-lg">
							{#if user.avatarUrl}
								<Avatar.Image src={user.avatarUrl} alt={user.name} class="rounded-lg" />
							{/if}
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs text-muted-foreground">{user.email}</span>
						</div>
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
						<Avatar.Root class="size-8 rounded-lg">
							{#if user.avatarUrl}
								<Avatar.Image src={user.avatarUrl} alt={user.name} class="rounded-lg" />
							{/if}
							<Avatar.Fallback class="rounded-lg">{initials}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs text-muted-foreground">{user.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item>
						<UserRoundIcon />
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<CreditCardIcon />
						Billing
					</DropdownMenu.Item>
					<DropdownMenu.Item>
						<HelpCircleIcon />
						Help &amp; support
					</DropdownMenu.Item>
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>
					<LogOutIcon />
					Log out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
