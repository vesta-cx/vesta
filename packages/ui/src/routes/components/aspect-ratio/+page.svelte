<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import * as AspectRatio from '@/ui/aspect-ratio/index.js';

</script>

<ComponentPageHeader name="Aspect Ratio" description="Keeps media, previews, and embeds locked to a predictable ratio across layouts." />

<section class="flex flex-col gap-8">
	<DemoBlock title="16:9 preview">
		{#snippet preview()}
			<AspectRatio.Root ratio={16 / 9} class="w-full max-w-xl overflow-hidden rounded-lg border bg-muted">
				<div class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,var(--color-primary),transparent_35%),linear-gradient(135deg,var(--color-muted),var(--color-background))] text-sm font-medium text-muted-foreground">Hero media</div>
			</AspectRatio.Root>
		{/snippet}
	</DemoBlock>
</section>
