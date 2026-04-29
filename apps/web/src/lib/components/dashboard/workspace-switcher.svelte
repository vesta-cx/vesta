<script lang="ts" module>
	import type { Component } from 'svelte';

	export type Workspace = {
		name: string;
		plan: string;
		logo: Component;
	};
</script>

<script lang="ts">
	import * as DropdownMenu from '@vesta-cx/ui/components/ui/dropdown-menu';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import { useSidebar } from '@vesta-cx/ui/components/ui/sidebar';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let { workspaces }: { workspaces: Workspace[] } = $props();

	const sidebar = useSidebar();
	let activeIndex = $state(0);
	const active = $derived(workspaces[activeIndex] ?? workspaces[0]);
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
						<div
							class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
						>
							<active.logo class="size-4" />
						</div>
						<div class="grid min-w-0 flex-1 text-start text-sm leading-tight">
							<span class="truncate font-medium">{active.name}</span>
							<span class="truncate text-xs text-muted-foreground">{active.plan}</span>
						</div>
						<ChevronsUpDownIcon class="ms-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
				align="start"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				sideOffset={4}
			>
				<DropdownMenu.Label class="text-xs text-muted-foreground">Workspaces</DropdownMenu.Label>
				{#each workspaces as workspace, index (workspace.name)}
					<DropdownMenu.Item onSelect={() => (activeIndex = index)} class="gap-2 p-2">
						<div class="flex size-6 items-center justify-center rounded-md border">
							<workspace.logo class="size-3.5" />
						</div>
						<span class="truncate">{workspace.name}</span>
						<DropdownMenu.Shortcut>⌘{index + 1}</DropdownMenu.Shortcut>
					</DropdownMenu.Item>
				{/each}
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="gap-2 p-2">
					<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
						<PlusIcon class="size-4" />
					</div>
					<span class="font-medium text-muted-foreground">New workspace</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
