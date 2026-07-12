<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as RangeCalendar from '@/ui/range-calendar/index.js';

</script>

<ComponentPageHeader name="Range Calendar" description="Selects a start and end date for reports, bookings, or analytics windows." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Reporting range">
		{#snippet preview()}
			<RangeCalendar.RangeCalendar class="rounded-md border" />
		{/snippet}
	</DemoBlock>
</section>
