<script lang="ts">
	/**
	 * Overall stats from snapshot: total responses, sessions, neither rate, avg response time.
	 */
	let {
		totalResponses,
		totalSessions = null,
		neitherRate = null,
		avgResponseTimeMs = null,
		class: className = ''
	}: {
		totalResponses: number;
		totalSessions?: number | null;
		neitherRate?: number | null;
		avgResponseTimeMs?: number | null;
		class?: string;
	} = $props();
</script>

<div class="flex flex-wrap gap-4 {className}">
	<div class="rounded-lg border bg-card p-4">
		<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
			Total Responses
		</p>
		<p class="mt-1 text-2xl font-semibold">{totalResponses.toLocaleString()}</p>
	</div>
	{#if totalSessions != null && totalSessions > 0}
		<div class="rounded-lg border bg-card p-4">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">Sessions</p>
			<p class="mt-1 text-2xl font-semibold">{totalSessions.toLocaleString()}</p>
		</div>
	{/if}
	{#if neitherRate != null && neitherRate > 0}
		<div class="rounded-lg border bg-card p-4">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
				"Can't tell" rate
			</p>
			<p class="mt-1 text-2xl font-semibold">
				{(neitherRate * 100).toFixed(1)}%
			</p>
			<p class="mt-0.5 text-xs text-muted-foreground">
				Responses where listeners couldn't pick a winner
			</p>
		</div>
	{/if}
	{#if avgResponseTimeMs != null && avgResponseTimeMs > 0}
		<div class="rounded-lg border bg-card p-4">
			<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
				Avg. decision time
			</p>
			<p class="mt-1 text-2xl font-semibold">
				{avgResponseTimeMs < 1000
					? `${avgResponseTimeMs}ms`
					: `${(avgResponseTimeMs / 1000).toFixed(1)}s`}
			</p>
		</div>
	{/if}
</div>
