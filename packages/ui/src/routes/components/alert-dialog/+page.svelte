<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as AlertDialog from '@/ui/alert-dialog/index.js';
	import { Button } from '@/ui/button/index.js';

</script>

<ComponentPageHeader name="Alert Dialog" description="Requires confirmation before a destructive or irreversible action continues." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Destructive confirmation">
		{#snippet preview()}
			<AlertDialog.Root>
				<AlertDialog.Trigger>
					{#snippet child({ props })}
						<Button variant="destructive" {...props}>Delete workspace</Button>
					{/snippet}
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Delete this workspace?</AlertDialog.Title>
						<AlertDialog.Description>This action cannot be undone. All dashboards and saved reports will be removed.</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<AlertDialog.Action>Delete</AlertDialog.Action>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		{/snippet}
	</DemoBlock>
</section>
