<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Resizable from '@/ui/resizable/index.js';

</script>

<ComponentPageHeader name="Resizable" description="Creates adjustable split-pane layouts for dashboards and editors." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Split workspace">
		{#snippet preview()}
			<Resizable.PaneGroup direction="horizontal" class="h-56 max-w-xl rounded-lg border">
				<Resizable.Pane defaultSize={35} class="flex items-center justify-center p-4 text-sm text-muted-foreground">Sidebar</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane defaultSize={65} class="flex items-center justify-center p-4 text-sm text-muted-foreground">Workspace</Resizable.Pane>
			</Resizable.PaneGroup>
		{/snippet}
	</DemoBlock>
</section>
