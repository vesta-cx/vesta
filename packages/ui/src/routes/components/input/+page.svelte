<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Input } from '@/ui/input/index.js';

</script>

<ComponentPageHeader name="Input" description="Collects a single line of user-entered text, numbers, or files." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Search field">
		{#snippet preview()}
			<div class="grid w-full max-w-sm gap-3"><Input placeholder="Search customers..." /><Input type="email" value="mia@vesta.cx" /><Input aria-invalid="true" value="not-an-email" /></div>
		{/snippet}
	</DemoBlock>
</section>
