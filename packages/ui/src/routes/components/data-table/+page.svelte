<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Table from '@/ui/table/index.js';
	import { Badge } from '@/ui/badge/index.js';

</script>

<ComponentPageHeader name="Data Table" description="Pairs TanStack table helpers with Vesta table primitives for sortable, renderable datasets." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Customer health rows">
		{#snippet preview()}
			<Table.Root class="w-full max-w-2xl">
				<Table.Header><Table.Row><Table.Head>Account</Table.Head><Table.Head>Owner</Table.Head><Table.Head>Status</Table.Head><Table.Head class="text-right">ARR</Table.Head></Table.Row></Table.Header>
				<Table.Body>
					<Table.Row><Table.Cell>Acme</Table.Cell><Table.Cell>Mia</Table.Cell><Table.Cell><Badge>Healthy</Badge></Table.Cell><Table.Cell class="text-right">$84k</Table.Cell></Table.Row>
					<Table.Row><Table.Cell>Northstar</Table.Cell><Table.Cell>Ava</Table.Cell><Table.Cell><Badge variant="secondary">Watching</Badge></Table.Cell><Table.Cell class="text-right">$51k</Table.Cell></Table.Row>
				</Table.Body>
			</Table.Root>
		{/snippet}
	</DemoBlock>
</section>
