<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Input } from '@/ui/input/index.js';
	import { Label } from '@/ui/label/index.js';

</script>

<ComponentPageHeader name="Label" description="Associates text with a form control for better click targets and accessibility." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Control label">
		{#snippet preview()}
			<div class="grid w-full max-w-sm gap-2"><Label for="company">Company</Label><Input id="company" value="Vesta CX" /></div>
		{/snippet}
	</DemoBlock>
</section>
