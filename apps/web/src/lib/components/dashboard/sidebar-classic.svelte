<script lang="ts">
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import {
		dashboardUser,
		dashboardWorkspaces,
		primaryNav,
		secondaryNav
	} from './data.js';
	import NavCollapsible from './nav-collapsible.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import WorkspaceSwitcher from './workspace-switcher.svelte';

	// Variant A: shadcn sidebar-07 — workspace switcher + collapsible nav + user menu.
	// Settings/help live under a single "Workspace" group, no separate secondary rail.
	const workspaceGroup = secondaryNav.slice(0, 3);
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<WorkspaceSwitcher workspaces={dashboardWorkspaces} />
	</Sidebar.Header>

	<Sidebar.Content>
		<NavCollapsible label="Workspace" items={primaryNav} />
		<NavSecondary items={workspaceGroup} class="mt-auto" />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser user={dashboardUser} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
