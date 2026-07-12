<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Calendar from '@/ui/calendar/index.js';

</script>

<ComponentPageHeader name="Calendar" description="Lets people pick a single date with accessible keyboard navigation." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Date picker calendar">
		{#snippet preview()}
			<div class="rounded-md border"><Calendar.Calendar type="single" /></div>
		{/snippet}
	</DemoBlock>
</section>
