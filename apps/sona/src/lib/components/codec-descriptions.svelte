<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils.js';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		codecs: string[];
		descriptions: Record<string, string>;
	}
	let { codecs, descriptions, class: className, ...rest }: Props = $props();
</script>

<div class={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-4', className)} {...rest}>
	{#each codecs as codec (codec)}
		<div class="rounded-lg border bg-card p-4">
			<h4 class="font-medium">{codec}</h4>
			<p class="mt-1 text-xs text-muted-foreground">
				{descriptions[codec]}
			</p>
		</div>
	{/each}
</div>
