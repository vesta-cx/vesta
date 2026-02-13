<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ChartRootProps {
		class?: string;
		aspectRatio?: string;
		children: Snippet;
	}
</script>

<script lang="ts">
	import { cn } from '$lib/utils.js';

	let { class: className, aspectRatio = '16/9', children }: ChartRootProps = $props();
</script>

<div
	class={cn('w-full overflow-hidden rounded-lg', className)}
	style="aspect-ratio: {aspectRatio};"
>
	{@render children()}
</div>
