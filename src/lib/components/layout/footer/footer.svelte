<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<footer class="flex w-full items-center justify-center">
	{@render children()}
</footer>

<style>
</style>
