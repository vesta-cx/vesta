<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Popover from '@/ui/popover/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Popover" description="Displays lightweight floating content tied to a trigger." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Quick filter">
		{#snippet preview()}
			<Popover.Root><Popover.Trigger>{#snippet child({ props })}<Button variant="outline" {...props}>Filter</Button>{/snippet}</Popover.Trigger><Popover.Content class="w-64"><div class="space-y-2"><h4 class="font-medium">Filter accounts</h4><p class="text-sm text-muted-foreground">Show only accounts with open renewal risks.</p></div></Popover.Content></Popover.Root>
		{/snippet}
	</DemoBlock>
</section>
