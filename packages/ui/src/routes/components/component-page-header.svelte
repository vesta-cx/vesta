<script lang="ts">
	let {
		name,
		description
	}: {
		name: string;
		description: string;
	} = $props();
</script>

<header class="flex flex-col gap-2 border-b pb-8">
	<p class="text-sm font-medium uppercase tracking-wider text-muted-foreground">Component</p>
	<h1 class="text-4xl font-semibold tracking-tight">{name}</h1>
	<p class="max-w-2xl text-muted-foreground">{description}</p>
</header>
