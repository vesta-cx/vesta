<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<footer>
	{@render children()}
</footer>

<style>
</style>
