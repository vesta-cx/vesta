<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as Menubar from '@/ui/menubar/index.js';

</script>

<ComponentPageHeader name="Menubar" description="Organizes application-level commands into keyboard-accessible menus." />

<section class="flex flex-col gap-8">
	<DemoBlock title="App menu">
		{#snippet preview()}
			<Menubar.Root>
				<Menubar.Menu><Menubar.Trigger>File</Menubar.Trigger><Menubar.Content><Menubar.Item>New dashboard<Menubar.Shortcut>⌘N</Menubar.Shortcut></Menubar.Item><Menubar.Item>Export</Menubar.Item></Menubar.Content></Menubar.Menu>
				<Menubar.Menu><Menubar.Trigger>View</Menubar.Trigger><Menubar.Content><Menubar.CheckboxItem checked>Show sidebar</Menubar.CheckboxItem><Menubar.Item>Zoom in</Menubar.Item></Menubar.Content></Menubar.Menu>
			</Menubar.Root>
		{/snippet}
	</DemoBlock>
</section>
