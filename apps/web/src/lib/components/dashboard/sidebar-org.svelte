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

	// Variant B: shadcn sidebar-08 — primary collapsible nav + bottom secondary rail
	// for org/settings/help, separated from the user menu in the footer.
</script>

<Sidebar.Root collapsible="icon" variant="inset">
	<Sidebar.Header>
		<WorkspaceSwitcher workspaces={dashboardWorkspaces} />
	</Sidebar.Header>

	<Sidebar.Content>
		<NavCollapsible label="Workspace" items={primaryNav} />
		<NavSecondary items={secondaryNav} class="mt-auto" />
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser user={dashboardUser} />
	</Sidebar.Footer>
</Sidebar.Root>
