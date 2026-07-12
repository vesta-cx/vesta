<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Table from '@/ui/table/index.js';

</script>

<ComponentPageHeader name="Table" description="Displays structured rows and columns with styled headers, captions, and totals." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Invoices">
		{#snippet preview()}
			<Table.Root class="w-full max-w-xl"><Table.Caption>Recent invoices</Table.Caption><Table.Header><Table.Row><Table.Head>Invoice</Table.Head><Table.Head>Status</Table.Head><Table.Head class="text-right">Amount</Table.Head></Table.Row></Table.Header><Table.Body><Table.Row><Table.Cell>INV-001</Table.Cell><Table.Cell>Paid</Table.Cell><Table.Cell class="text-right">$250.00</Table.Cell></Table.Row><Table.Row><Table.Cell>INV-002</Table.Cell><Table.Cell>Pending</Table.Cell><Table.Cell class="text-right">$150.00</Table.Cell></Table.Row></Table.Body><Table.Footer><Table.Row><Table.Cell colspan={2}>Total</Table.Cell><Table.Cell class="text-right">$400.00</Table.Cell></Table.Row></Table.Footer></Table.Root>
		{/snippet}
	</DemoBlock>
</section>
