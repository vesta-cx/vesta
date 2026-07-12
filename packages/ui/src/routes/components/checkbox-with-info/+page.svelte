<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { CheckboxWithInfo } from '@/ui/checkbox-with-info/index.js';

	let checked = $state(true);
</script>

<ComponentPageHeader name="Checkbox With Info" description="Combines a checkbox label with inline help for settings that need extra context." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Setting with explanation">
		{#snippet preview()}
			<CheckboxWithInfo label="Enable AI summaries" {checked} onCheckedChange={(value) => (checked = value)} infoContent="Summaries are generated after a customer conversation is closed." />
		{/snippet}
	</DemoBlock>
</section>
