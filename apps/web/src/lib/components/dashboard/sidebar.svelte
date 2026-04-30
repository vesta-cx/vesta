<script lang="ts">
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import {
		dashboardNav,
		dashboardOrganizations,
		dashboardWorkspaces,
		organizationSettingsHref,
		workspaceSettingsHref,
		type Workspace
	} from './data.js';
	import NavCollapsible from './nav-collapsible.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser, { type DashboardUser } from './nav-user.svelte';
	import WorkspaceSwitcher from './workspace-switcher.svelte';

	let { user }: { user: DashboardUser } = $props();

	let active = $state<Workspace>(dashboardWorkspaces[0]);

	const activeOrganization = $derived(
		active.organizationId
			? (dashboardOrganizations.find((org) => org.id === active.organizationId) ?? null)
			: null
	);

	/**
	 * Bottom rail tracks the active workspace's context:
	 *  - Workspace settings is always available.
	 *  - Organization settings only when the active workspace lives inside an
	 *    organization the user can manage.
	 */
	const bottomRail = $derived.by(() => {
		const items = [
			{ title: 'Workspace settings', href: workspaceSettingsHref(active.id), icon: SettingsIcon }
		];
		if (activeOrganization?.manageable) {
			items.push({
				title: `${activeOrganization.name} settings`,
				href: organizationSettingsHref(activeOrganization.id),
				icon: Building2Icon
			});
		}
		return items;
	});
</script>

<Sidebar.Root collapsible="icon" variant="inset">
	<Sidebar.Header>
		<WorkspaceSwitcher workspaces={dashboardWorkspaces} bind:active />
	</Sidebar.Header>

	<Sidebar.Content>
		<NavCollapsible label={active.kind === 'label' ? 'Label' : 'Workspace'} items={dashboardNav} />
		<NavSecondary items={bottomRail} class="mt-auto" />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser {user} />
	</Sidebar.Footer>
</Sidebar.Root>
