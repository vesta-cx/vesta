<script lang="ts">
	/**
	 * Device and price tier participation breakdown.
	 */
	let {
		headphonesCount = null,
		speakersCount = null,
		budgetCount = null,
		midCount = null,
		premiumCount = null,
		flagshipCount = null,
		deviceBreakdown = {},
		class: className = ''
	}: {
		headphonesCount?: number | null;
		speakersCount?: number | null;
		budgetCount?: number | null;
		midCount?: number | null;
		premiumCount?: number | null;
		flagshipCount?: number | null;
		deviceBreakdown?: Record<string, number>;
		class?: string;
	} = $props();

	const deviceEntries = $derived.by(() => {
		if (headphonesCount != null || speakersCount != null) {
			const entries: Array<{ label: string; count: number }> = [];
			if (headphonesCount != null) entries.push({ label: 'Headphones', count: headphonesCount });
			if (speakersCount != null) entries.push({ label: 'Speakers', count: speakersCount });
			return entries.sort((a, b) => b.count - a.count);
		}
		return Object.entries(deviceBreakdown)
			.map(([k, v]) => ({
				label: k === 'speaker' ? 'Speakers' : k.charAt(0).toUpperCase() + k.slice(1),
				count: v
			}))
			.sort((a, b) => b.count - a.count);
	});

	const tierEntries = $derived.by(() => {
		const entries: Array<{ label: string; count: number }> = [];
		if (budgetCount != null) entries.push({ label: 'Budget', count: budgetCount });
		if (midCount != null) entries.push({ label: 'Mid', count: midCount });
		if (premiumCount != null) entries.push({ label: 'Premium', count: premiumCount });
		if (flagshipCount != null) entries.push({ label: 'Flagship', count: flagshipCount });
		return entries.sort((a, b) => b.count - a.count);
	});
</script>

<div class={className}>
	{#if deviceEntries.length > 0}
		<div>
			<h3 class="text-sm font-medium text-muted-foreground">Device Type</h3>
			<div class="mt-2 space-y-2">
				{#each deviceEntries as { label, count }}
					<div class="flex items-center justify-between text-sm">
						<span>{label}</span>
						<span class="text-muted-foreground">{count}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	{#if tierEntries.length > 0}
		<div class={deviceEntries.length > 0 ? 'mt-4' : ''}>
			<h3 class="text-sm font-medium text-muted-foreground">Price Tier</h3>
			<div class="mt-2 space-y-2">
				{#each tierEntries as { label, count }}
					<div class="flex items-center justify-between text-sm">
						<span>{label}</span>
						<span class="text-muted-foreground">{count}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
