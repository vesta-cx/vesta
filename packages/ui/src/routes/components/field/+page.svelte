<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Field from '@/ui/field/index.js';
	import { Input } from '@/ui/input/index.js';

</script>

<ComponentPageHeader name="Field" description="Builds accessible label, description, control, and error groups for forms." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Labeled input group">
		{#snippet preview()}
			<Field.Set class="w-full max-w-sm">
				<Field.Legend>Workspace</Field.Legend>
				<Field.Group><Field.Label for="workspace-name">Name</Field.Label><Input id="workspace-name" value="Growth team" /><Field.Description>Shown in navigation and billing receipts.</Field.Description></Field.Group>
			</Field.Set>
		{/snippet}
	</DemoBlock>
</section>
