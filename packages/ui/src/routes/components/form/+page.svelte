<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Field from '@/ui/field/index.js';
	import * as Form from '@/ui/form/index.js';
	import { Input } from '@/ui/input/index.js';

</script>

<ComponentPageHeader name="Form" description="Connects form controls to validation state and submission actions." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Submit-ready form layout">
		{#snippet preview()}
			<form class="w-full max-w-sm space-y-4">
				<Field.Group><Field.Label for="email">Email</Field.Label><Input id="email" type="email" placeholder="you@company.com" /><Field.Description>Used for account notifications.</Field.Description></Field.Group>
				<Form.Button>Save preferences</Form.Button>
			</form>
		{/snippet}
	</DemoBlock>
</section>
