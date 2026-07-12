<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as ToggleGroup from '@/ui/toggle-group/index.js';

	let value = $state('center');
</script>

<ComponentPageHeader name="Toggle Group" description="Groups related toggles for single or multiple selection." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Text alignment">
		{#snippet preview()}
			<ToggleGroup.Root type="single" bind:value variant="outline"><ToggleGroup.Item value="left" aria-label="Align left">Left</ToggleGroup.Item><ToggleGroup.Item value="center" aria-label="Align center">Center</ToggleGroup.Item><ToggleGroup.Item value="right" aria-label="Align right">Right</ToggleGroup.Item></ToggleGroup.Root>
		{/snippet}
	</DemoBlock>
</section>
