<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Kbd from '@/ui/kbd/index.js';

</script>

<ComponentPageHeader name="Kbd" description="Displays keyboard shortcuts in menus, help text, and command surfaces." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Shortcut group">
		{#snippet preview()}
			<Kbd.Group><Kbd.Root>⌘</Kbd.Root><Kbd.Root>K</Kbd.Root></Kbd.Group>
		{/snippet}
	</DemoBlock>
</section>
