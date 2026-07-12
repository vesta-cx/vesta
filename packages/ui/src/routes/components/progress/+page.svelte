<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Progress } from '@/ui/progress/index.js';

</script>

<ComponentPageHeader name="Progress" description="Shows completion for a determinate background task." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Import progress">
		{#snippet preview()}
			<div class="w-full max-w-sm space-y-2"><div class="flex justify-between text-sm"><span>Importing contacts</span><span class="text-muted-foreground">64%</span></div><Progress value={64} /></div>
		{/snippet}
	</DemoBlock>
</section>
