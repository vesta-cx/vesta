<script lang="ts">
	let {
		label,
		value,
		helper
	}: { label: string; value: string | number; helper?: string } = $props();

	const formatted = $derived(typeof value === 'number' ? value.toLocaleString() : value);
</script>

<div class="space-y-1">
	<p class="text-sm text-muted-foreground">{label}</p>
	<p class="text-3xl font-semibold tracking-tight">{formatted}</p>
	{#if helper}
		<p class="text-xs text-muted-foreground">{helper}</p>
	{/if}
</div>
