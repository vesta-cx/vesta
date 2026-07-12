<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Collapsible from '@/ui/collapsible/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Collapsible" description="Shows and hides auxiliary content without changing the current page." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Release notes drawer">
		{#snippet preview()}
			<Collapsible.Root class="w-full max-w-sm space-y-2">
				<Collapsible.Trigger>
					{#snippet child({ props })}<Button variant="outline" {...props}>Toggle release notes</Button>{/snippet}
				</Collapsible.Trigger>
				<Collapsible.Content class="rounded-md border p-4 text-sm text-muted-foreground">Includes faster search, better exports, and improved dashboard filters.</Collapsible.Content>
			</Collapsible.Root>
		{/snippet}
	</DemoBlock>
</section>
