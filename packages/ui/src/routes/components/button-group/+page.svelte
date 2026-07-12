<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as ButtonGroup from '@/ui/button-group/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Button Group" description="Groups related actions so their shared scope is obvious." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Segmented actions">
		{#snippet preview()}
			<ButtonGroup.Root>
				<Button variant="outline">Day</Button>
				<Button variant="outline">Week</Button>
				<Button variant="outline">Month</Button>
				<ButtonGroup.Separator />
				<Button variant="outline">Export</Button>
			</ButtonGroup.Root>
		{/snippet}
	</DemoBlock>
</section>
