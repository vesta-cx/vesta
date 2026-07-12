<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Drawer from '@/ui/drawer/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Drawer" description="Slides in a supplemental workflow, especially useful on smaller screens." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Mobile details panel">
		{#snippet preview()}
			<Drawer.Root>
				<Drawer.Trigger>{#snippet child({ props })}<Button variant="outline" {...props}>Open drawer</Button>{/snippet}</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header><Drawer.Title>Deal details</Drawer.Title><Drawer.Description>Review the latest activity before updating stage.</Drawer.Description></Drawer.Header>
					<div class="px-4 pb-4 text-sm text-muted-foreground">Last touch: executive sponsor replied 2 hours ago.</div>
					<Drawer.Footer><Button>Move forward</Button><Drawer.Close>{#snippet child({ props })}<Button variant="outline" {...props}>Cancel</Button>{/snippet}</Drawer.Close></Drawer.Footer>
				</Drawer.Content>
			</Drawer.Root>
		{/snippet}
	</DemoBlock>
</section>
