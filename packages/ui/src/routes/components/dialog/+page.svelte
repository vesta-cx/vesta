<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Dialog from '@/ui/dialog/index.js';
	import { Button } from '@/ui/button/index.js';
	import { Input } from '@/ui/input/index.js';

</script>

<ComponentPageHeader name="Dialog" description="Opens a focused modal task while preserving the user’s page context." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Edit profile">
		{#snippet preview()}
			<Dialog.Root>
				<Dialog.Trigger>{#snippet child({ props })}<Button variant="outline" {...props}>Edit profile</Button>{/snippet}</Dialog.Trigger>
				<Dialog.Content>
					<Dialog.Header><Dialog.Title>Edit profile</Dialog.Title><Dialog.Description>Update the display name shown to teammates.</Dialog.Description></Dialog.Header>
					<Input value="Mia Cx" aria-label="Display name" />
					<Dialog.Footer><Button>Save changes</Button></Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		{/snippet}
	</DemoBlock>
</section>
