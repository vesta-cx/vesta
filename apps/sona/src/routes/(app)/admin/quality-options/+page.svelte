<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Group by codec
	const grouped = $derived(
		data.codecs.map((codec) => ({
			codec,
			options: data.options.filter((o) => o.codec === codec).sort((a, b) => b.bitrate - a.bitrate)
		}))
	);
</script>

<svelte:head>
	<title>Quality Options | Admin</title>
</svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">Quality Options</h1>
		<form method="POST" action="?/seed" use:enhance>
			<button
				type="submit"
				class="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80"
			>
				Seed Defaults
			</button>
		</form>
	</div>

	{#if form?.message}
		<div
			class="rounded-lg border bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-200"
		>
			{form.message}
		</div>
	{/if}

	{#if data.options.length === 0}
		<p class="py-12 text-center text-sm text-muted-foreground">
			No quality options configured. Click "Seed Defaults" to populate the standard set.
		</p>
	{:else}
		<div class="grid gap-6 lg:grid-cols-2">
			{#each grouped as group}
				{#if group.options.length > 0}
					<div class="rounded-xl border bg-card p-4">
						<h2 class="mb-3 text-lg font-medium uppercase">{group.codec}</h2>
						<div class="space-y-2">
							{#each group.options as option}
								<div class="flex items-center justify-between">
									<span class="text-sm">
										{option.bitrate === 0 ? 'Lossless' : `${option.bitrate} kbps`}
									</span>
									<form method="POST" action="?/toggle" use:enhance>
										<input type="hidden" name="codec" value={option.codec} />
										<input type="hidden" name="bitrate" value={option.bitrate} />
										<input type="hidden" name="enabled" value={option.enabled.toString()} />
										<button
											type="submit"
											class="rounded-full px-3 py-1 text-xs font-medium transition-colors {option.enabled
												? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
												: 'bg-muted text-muted-foreground hover:bg-muted/80'}"
										>
											{option.enabled ? 'Enabled' : 'Disabled'}
										</button>
									</form>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
