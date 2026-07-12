<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Toggle } from '@/ui/toggle/index.js';

</script>

<ComponentPageHeader name="Toggle" description="Turns a single formatting or view option on and off." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Formatting toggle">
		{#snippet preview()}
			<Toggle aria-label="Toggle bold">B</Toggle>
		{/snippet}
	</DemoBlock>
</section>
