<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as ScrollArea from '@/ui/scroll-area/index.js';

</script>

<ComponentPageHeader name="Scroll Area" description="Provides styled scroll containers for dense content without losing native behavior." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Activity feed">
		{#snippet preview()}
			<ScrollArea.Root class="h-56 w-80 rounded-md border p-4">
				<div class="space-y-4">{#each Array.from({ length: 12 }, (_, i) => i + 1) as item (item)}<p class="text-sm"><span class="font-medium">Event {item}</span><br /><span class="text-muted-foreground">Customer activity synced successfully.</span></p>{/each}</div>
				<ScrollArea.Scrollbar orientation="vertical" />
			</ScrollArea.Root>
		{/snippet}
	</DemoBlock>
</section>
