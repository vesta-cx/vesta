<script lang="ts">
	import * as DropdownMenu from '@vesta-cx/ui/components/ui/dropdown-menu';
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import { useSidebar } from '@vesta-cx/ui/components/ui/sidebar';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import { dashboardOrganizations, type Organization, type Workspace } from './data.js';
	import { IN_DEVELOPMENT_TOOLTIP } from './nav-collapsible.svelte';

	let {
		workspaces,
		active = $bindable(),
		onSelect
	}: {
		workspaces: Workspace[];
		active: Workspace;
		onSelect?: (workspace: Workspace) => void;
	} = $props();

	const sidebar = useSidebar();

	type Group = { label: string; organization: Organization | null; items: Workspace[] };

	const groups: Group[] = $derived.by(() => {
		const personal = workspaces.filter((w) => w.organizationId === null);
		const orgGroups = dashboardOrganizations
			.map((org) => ({
				label: org.name,
				organization: org,
				items: workspaces.filter((w) => w.organizationId === org.id)
			}))
			.filter((group) => group.items.length > 0);

		return [
			...(personal.length > 0
				? [{ label: 'Personal', organization: null, items: personal }]
				: []),
			...orgGroups
		];
	});

	const select = (workspace: Workspace) => {
		active = workspace;
		onSelect?.(workspace);
	};
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
							<span class="truncate text-xs text-muted-foreground">{active.subtitle}</span>
						</div>
						<ChevronsUpDownIcon class="ms-auto size-4" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-72 rounded-lg p-1"
				align="start"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				sideOffset={4}
			>
				{#each groups as group, groupIndex (group.label)}
					<DropdownMenu.Group>
						<DropdownMenu.Label class="text-xs text-muted-foreground">
							{group.label}
						</DropdownMenu.Label>
						{#each group.items as workspace (workspace.id)}
							<DropdownMenu.Item
								class="group/workspace gap-2 p-2 pe-1.5"
								onSelect={() => select(workspace)}
							>
								<div class="flex size-6 items-center justify-center rounded-md border">
									<workspace.logo class="size-3.5 shrink-0" />
								</div>
								<div class="grid min-w-0 flex-1 leading-tight">
									<span class="truncate text-sm">{workspace.name}</span>
									<span class="truncate text-xs text-muted-foreground">
										{workspace.subtitle}
									</span>
								</div>
								{#if workspace.id === active.id}
									<span
										class="me-1 size-1.5 rounded-full bg-foreground"
										aria-label="Active workspace"
									></span>
								{/if}
								<span
									aria-disabled="true"
									title={IN_DEVELOPMENT_TOOLTIP}
									class="pointer-events-none flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity group-hover/workspace:opacity-60 group-focus-within/workspace:opacity-60"
									aria-label="Open {workspace.name} settings"
								>
									<SettingsIcon class="size-3.5" />
								</span>
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Group>
					{#if groupIndex < groups.length - 1}
						<DropdownMenu.Separator />
					{/if}
				{/each}

				<DropdownMenu.Separator />

				<DropdownMenu.Item
					disabled
					class="gap-2 p-2"
					title={IN_DEVELOPMENT_TOOLTIP}
				>
					<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
						<PlusIcon class="size-3.5" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">New workspace</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item
					disabled
					class="gap-2 p-2"
					title={IN_DEVELOPMENT_TOOLTIP}
				>
					<div class="flex size-6 items-center justify-center rounded-md border bg-transparent">
						<SettingsIcon class="size-3.5" />
					</div>
					<span class="text-sm font-medium text-muted-foreground">
						Manage organizations
					</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
