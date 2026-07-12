<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Sidebar from '@/ui/sidebar/index.js';

</script>

<ComponentPageHeader name="Sidebar" description="Provides app navigation with groups, actions, badges, and responsive collapse behavior." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Static app navigation">
		{#snippet preview()}
			<Sidebar.Provider class="!min-h-0 w-full max-w-xs rounded-lg border">
				<Sidebar.Root collapsible="none" class="h-72">
					<Sidebar.Header><div class="px-2 py-1.5 font-semibold">Vesta</div></Sidebar.Header>
					<Sidebar.Content><Sidebar.Group><Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel><Sidebar.Menu><Sidebar.MenuItem><Sidebar.MenuButton isActive>Dashboard</Sidebar.MenuButton></Sidebar.MenuItem><Sidebar.MenuItem><Sidebar.MenuButton>Customers<Sidebar.MenuBadge>12</Sidebar.MenuBadge></Sidebar.MenuButton></Sidebar.MenuItem><Sidebar.MenuItem><Sidebar.MenuButton>Reports</Sidebar.MenuButton></Sidebar.MenuItem></Sidebar.Menu></Sidebar.Group></Sidebar.Content>
				</Sidebar.Root>
			</Sidebar.Provider>
		{/snippet}
	</DemoBlock>
</section>
