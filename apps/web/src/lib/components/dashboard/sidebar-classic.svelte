<script lang="ts">
	import * as Sidebar from '@vesta-cx/ui/components/ui/sidebar';
	import {
		creatorNav,
		dashboardUser,
		dashboardWorkspaces,
		utilityNav
	} from './data.js';
	import NavCollapsible from './nav-collapsible.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import WorkspaceSwitcher from './workspace-switcher.svelte';

	// Variant A — solo creator. Sidebar-07 shape, optimised for one artist
	// running their own releases. Workspace switcher = artist project.
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<WorkspaceSwitcher workspaces={dashboardWorkspaces} />
	</Sidebar.Header>

	<Sidebar.Content>
		<NavCollapsible label="Release marketing" items={creatorNav} />
		<NavSecondary items={utilityNav.slice(0, 3)} class="mt-auto" />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser user={dashboardUser} />
	</Sidebar.Footer>
	<Sidebar.Rail />
</Sidebar.Root>
