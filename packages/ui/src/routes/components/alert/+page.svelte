<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Alert from '@/ui/alert/index.js';

</script>

<ComponentPageHeader name="Alert" description="Communicates important status, guidance, or risk inline with the surrounding workflow." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Status message">
		{#snippet preview()}
			<div class="grid w-full max-w-xl gap-3">
				<Alert.Root>
					<Alert.Title>Deployment queued</Alert.Title>
					<Alert.Description>Your dashboard changes will publish after checks finish.</Alert.Description>
				</Alert.Root>
				<Alert.Root variant="destructive">
					<Alert.Title>Payment failed</Alert.Title>
					<Alert.Description>Update the payment method to keep automations running.</Alert.Description>
				</Alert.Root>
			</div>
		{/snippet}
	</DemoBlock>
</section>
