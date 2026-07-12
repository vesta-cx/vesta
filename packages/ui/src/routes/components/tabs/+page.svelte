<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Tabs from '@/ui/tabs/index.js';

</script>

<ComponentPageHeader name="Tabs" description="Switches between related panels without navigating away from the page." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Account sections">
		{#snippet preview()}
			<Tabs.Root value="overview" class="w-full max-w-md"><Tabs.List><Tabs.Trigger value="overview">Overview</Tabs.Trigger><Tabs.Trigger value="activity">Activity</Tabs.Trigger><Tabs.Trigger value="settings">Settings</Tabs.Trigger></Tabs.List><Tabs.Content value="overview" class="rounded-md border p-4 text-sm text-muted-foreground">Account health and renewal summary.</Tabs.Content><Tabs.Content value="activity" class="rounded-md border p-4 text-sm text-muted-foreground">Recent conversations and lifecycle events.</Tabs.Content><Tabs.Content value="settings" class="rounded-md border p-4 text-sm text-muted-foreground">Workspace preferences and permissions.</Tabs.Content></Tabs.Root>
		{/snippet}
	</DemoBlock>
</section>
