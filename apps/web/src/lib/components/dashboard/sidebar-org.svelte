<script lang="ts">
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import {
		dashboardUser,
		dashboardWorkspaces,
		labelNav,
		labelUtilityNav
	} from './data.js';
	import NavCollapsible from './nav-collapsible.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import WorkspaceSwitcher from './workspace-switcher.svelte';

	// Variant B — label / manager. Sidebar-08 shape with a full secondary rail
	// for org-level surfaces: members, permissions, imports, billing, help.
	// Workspace switcher = label.
</script>

<Sidebar.Root collapsible="icon" variant="inset">
	<Sidebar.Header>
		<WorkspaceSwitcher workspaces={dashboardWorkspaces} />
	</Sidebar.Header>

	<Sidebar.Content>
		<NavCollapsible label="Label" items={labelNav} />
		<NavSecondary items={labelUtilityNav} class="mt-auto" />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser user={dashboardUser} />
	</Sidebar.Footer>
</Sidebar.Root>
