<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as InputGroup from '@/ui/input-group/index.js';

</script>

<ComponentPageHeader name="Input Group" description="Composes inputs with leading, trailing, or block-level affordances." />

<section class="flex flex-col gap-8">
	<DemoBlock title="URL builder">
		{#snippet preview()}
			<InputGroup.Root class="w-full max-w-md">
				<InputGroup.Text data-align="inline-start">https://</InputGroup.Text>
				<InputGroup.Input value="vesta.cx" aria-label="Domain" />
				<InputGroup.Button>Copy</InputGroup.Button>
			</InputGroup.Root>
		{/snippet}
	</DemoBlock>
</section>
