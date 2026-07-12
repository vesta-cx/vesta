<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Select from '@/ui/select/index.js';

	let value = $state('growth');
</script>

<ComponentPageHeader name="Select" description="Presents a custom-styled single-choice menu when the native control is not enough." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Custom plan picker">
		{#snippet preview()}
			<Select.Root type="single" bind:value>
				<Select.Trigger class="w-48">{value}</Select.Trigger>
				<Select.Content>
					<Select.Group><Select.GroupHeading>Plans</Select.GroupHeading><Select.Item value="starter">Starter</Select.Item><Select.Item value="growth">Growth</Select.Item><Select.Item value="enterprise">Enterprise</Select.Item></Select.Group>
				</Select.Content>
			</Select.Root>
		{/snippet}
	</DemoBlock>
</section>
