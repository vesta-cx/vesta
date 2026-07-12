<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as NavigationMenu from '@/ui/navigation-menu/index.js';

</script>

<ComponentPageHeader name="Navigation Menu" description="Builds top-level navigation with flyout content for product sections." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Product navigation">
		{#snippet preview()}
			<NavigationMenu.Root>
				<NavigationMenu.List>
					<NavigationMenu.Item><NavigationMenu.Trigger>Product</NavigationMenu.Trigger><NavigationMenu.Content><div class="grid w-80 gap-2 p-4"><NavigationMenu.Link href="/components/button" class="rounded-md p-3 hover:bg-muted"><div class="font-medium">Components</div><p class="text-sm text-muted-foreground">Reusable UI primitives.</p></NavigationMenu.Link></div></NavigationMenu.Content></NavigationMenu.Item>
					<NavigationMenu.Item><NavigationMenu.Link href="/components" class="px-4 py-2 text-sm font-medium">Docs</NavigationMenu.Link></NavigationMenu.Item>
				</NavigationMenu.List>
			</NavigationMenu.Root>
		{/snippet}
	</DemoBlock>
</section>
