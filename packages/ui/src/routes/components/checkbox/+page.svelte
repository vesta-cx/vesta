<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Checkbox from '@/ui/checkbox/index.js';
	import { Label } from '@/ui/label/index.js';

	let checked = $state(true);
	let indeterminate = $state(true);
</script>

<ComponentPageHeader name="Checkbox" description="Toggles a binary setting or supports an indeterminate selection state." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Notification preferences">
		{#snippet preview()}
			<div class="grid gap-3">
				<div class="flex items-center gap-2"><Checkbox.Root id="weekly" bind:checked /><Label for="weekly">Weekly digest</Label></div>
				<div class="flex items-center gap-2"><Checkbox.Root id="partial" bind:indeterminate /><Label for="partial">Some teams selected</Label></div>
			</div>
		{/snippet}
	</DemoBlock>
</section>
