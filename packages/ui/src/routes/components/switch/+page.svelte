<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Label } from '@/ui/label/index.js';
	import { Switch } from '@/ui/switch/index.js';

	let enabled = $state(true);
</script>

<ComponentPageHeader name="Switch" description="Toggles a setting that takes effect immediately." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Feature toggle">
		{#snippet preview()}
			<div class="flex items-center gap-3"><Switch id="summaries" bind:checked={enabled} /><Label for="summaries">AI summaries</Label></div>
		{/snippet}
	</DemoBlock>
</section>
