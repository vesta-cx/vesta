<script lang="ts">
	import { componentEntries } from '$lib/registry/components.js';

	const ready = $derived(componentEntries.filter((entry) => entry.status === 'ready'));
</script>

<header class="flex flex-col gap-2">
	<h1 class="text-3xl font-semibold tracking-tight">Component library</h1>
	<p class="max-w-2xl text-muted-foreground">
		Browse the Vesta UI primitives. Pick a component on the left to see live demos, variants, and
		usage notes.
	</p>
</header>

<section class="flex flex-col gap-3">
	<h2 class="text-sm font-medium uppercase tracking-wider text-muted-foreground">Ready</h2>
	<ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
		{#each ready as entry (entry.slug)}
			<li>
				<a
					href="/components/{entry.slug}"
					class="flex h-full flex-col gap-1 rounded-lg border p-4 transition hover:border-foreground/30 hover:bg-muted/40"
				>
					<span class="font-medium">{entry.name}</span>
					{#if entry.description}
						<span class="text-sm text-muted-foreground">{entry.description}</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
</section>
