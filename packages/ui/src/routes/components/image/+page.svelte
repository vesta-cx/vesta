<script lang="ts">
	import ComponentPageHeader from '../component-page-header.svelte';
	import DemoBlock from '../demo-block.svelte';
	import { Image } from '@/ui/image/index.js';

</script>

<ComponentPageHeader name="Image" description="Wraps image rendering with the library’s predictable API surface." />

<section class="flex flex-col gap-8">
	<DemoBlock title="Responsive image">
		{#snippet preview()}
			<Image src="https://picsum.photos/id/1025/640/360" alt="A dog wrapped in a blanket" class="aspect-video w-full max-w-xl rounded-lg border object-cover" />
		{/snippet}
	</DemoBlock>
</section>
