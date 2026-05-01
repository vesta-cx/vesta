<script lang="ts">
	let {
		section,
		title,
		description,
		sectionHref
	}: {
		section: string;
		title: string;
		description?: string;
		sectionHref?: string;
	} = $props();
</script>

<header class="space-y-1">
	<div class="flex items-baseline gap-1.5">
		{#if section !== title}
			{#if sectionHref}
				<a
					class="text-xs font-medium text-muted-foreground hover:text-foreground"
					href={sectionHref}
				>
					{section}
				</a>
			{:else}
				<span class="text-xs font-medium text-muted-foreground">{section}</span>
			{/if}
			<span class="text-xs font-medium text-muted-foreground">/</span>
		{/if}
		<h2 class="text-lg font-semibold">{title}</h2>
	</div>
	{#if description}
		<p class="text-sm text-muted-foreground">{description}</p>
	{/if}
</header>
