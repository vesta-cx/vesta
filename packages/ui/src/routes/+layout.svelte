<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import PageTransition from '$lib/components/PageTransition.svelte';
	import { onDestroy, onMount } from 'svelte';
	import '../app.css';
	import type { LayoutProps } from './$types.js';

	let { data, children }: LayoutProps = $props();

	let ready = $state(false);

	onMount(() => {
		ready = true;
	});

	onDestroy(() => {
		ready = false;
	});

	beforeNavigate(({ willUnload }) => {
		if (willUnload) ready = false;
	});
</script>

{#snippet layout()}
	<PageTransition key={data.url.pathname} {children} />
{/snippet}

{@render layout()}
