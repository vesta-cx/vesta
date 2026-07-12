<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as ContextMenu from '@/ui/context-menu/index.js';

</script>

<ComponentPageHeader name="Context Menu" description="Surfaces object-specific actions from a right-click or long-press interaction." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Canvas actions">
		{#snippet preview()}
			<ContextMenu.Root>
				<ContextMenu.Trigger>
					{#snippet child({ props })}<div {...props} class="flex h-40 w-72 items-center justify-center rounded-lg border border-dashed bg-muted/40 text-sm text-muted-foreground">Right-click the canvas</div>{/snippet}
				</ContextMenu.Trigger>
				<ContextMenu.Content>
					<ContextMenu.Item>Duplicate</ContextMenu.Item>
					<ContextMenu.Item>Rename</ContextMenu.Item>
					<ContextMenu.Separator />
					<ContextMenu.Item variant="destructive">Delete</ContextMenu.Item>
				</ContextMenu.Content>
			</ContextMenu.Root>
		{/snippet}
	</DemoBlock>
</section>
