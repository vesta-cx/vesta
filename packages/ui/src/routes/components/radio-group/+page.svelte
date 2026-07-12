<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as RadioGroup from '@/ui/radio-group/index.js';
	import { Label } from '@/ui/label/index.js';

	let plan = $state('growth');
</script>

<ComponentPageHeader name="Radio Group" description="Lets people choose exactly one option from a small set." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Plan selection">
		{#snippet preview()}
			<RadioGroup.Root bind:value={plan} class="grid gap-3">
				{#each ['starter', 'growth', 'enterprise'] as option (option)}<div class="flex items-center gap-2"><RadioGroup.Item value={option} id={option} /><Label for={option} class="capitalize">{option}</Label></div>{/each}
			</RadioGroup.Root>
		{/snippet}
	</DemoBlock>
</section>
