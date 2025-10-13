<!-- Link to route on same site: use right arrow icon -->
<!-- Link to page on other site: use up-right arrow icon -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		href,
		icon,
		children
	}: {
		href: string;
		icon?: Snippet;
		children: Snippet;
	} = $props();

	let isExternal = $derived(!href.startsWith('/'));

	const defaultIcons = {
		internal: 'arrow-right',
		external: 'arrow-up-right'
	};
</script>

{#snippet default_icon()}
    
{/snippet}

{#snippet default_icon_external()}
  
{/snippet}

<a {href} class="link">
	{@render children()}
	<span class="icon">
		{#if icon}
			{@render icon()}
		{:else}
			<!-- default icons depending on  -->
		{/if}
	</span>
</a>
