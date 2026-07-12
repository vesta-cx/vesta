<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Button } from '@/ui/button/index.js';
	import { Toaster } from '@/ui/sonner/index.js';
	import { toast } from 'svelte-sonner';

</script>

<ComponentPageHeader name="Sonner" description="Displays toast notifications for transient feedback after user actions." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Toast feedback">
		{#snippet preview()}
			<div><Button onclick={() => toast.success('Report exported')}>Show toast</Button><Toaster /></div>
		{/snippet}
	</DemoBlock>
</section>
