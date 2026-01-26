<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		class: className,
		...restProps
	}: { children: Snippet; class?: string } = $props();
</script>

<main role="document" class="flex flex-1 flex-col {className}" {...restProps}>
	{@render children()}
</main>

<style>
</style>
