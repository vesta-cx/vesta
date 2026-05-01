<script lang="ts">
	let {
		section,
		title,
		description
	}: {
		section: string;
		title: string;
		description?: string;
	} = $props();
</script>

<header class="space-y-1">
	<p class="text-xs font-medium text-muted-foreground">
		{#if section === title}
			{section}
		{:else}
			{section} / {title}
		{/if}
	</p>
	<h2 class="text-lg font-semibold">{title}</h2>
	{#if description}
		<p class="text-sm text-muted-foreground">{description}</p>
	{/if}
</header>
