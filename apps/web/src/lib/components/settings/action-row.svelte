<script lang="ts" module>
	import type { Snippet } from 'svelte';
</script>

<script lang="ts">
	let {
		title,
		description,
		danger = false,
		action
	}: {
		title: string;
		description?: string;
		danger?: boolean;
		action?: Snippet;
	} = $props();
</script>

<li class="flex items-center justify-between gap-4 py-3">
	<div class="min-w-0 space-y-0.5">
		<p class="text-sm font-medium" class:text-destructive={danger}>{title}</p>
		{#if description}
			<p class="text-xs text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if action}
		<div class="shrink-0">{@render action()}</div>
	{/if}
</li>
