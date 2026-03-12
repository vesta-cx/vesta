<script lang="ts">
	import { Anchor } from '@vesta-cx/ui/components/utils/anchor';

	let {
		labelA,
		labelB,
		selected,
		streamUrlA = null,
		streamUrlB = null,
		isDifferentSong = true
	}: {
		labelA: string;
		labelB: string;
		selected: 'a' | 'b' | 'neither';
		streamUrlA?: string | null;
		streamUrlB?: string | null;
		isDifferentSong?: boolean;
	} = $props();

	const selectedStyles = 'font-medium text-foreground ring-1 ring-primary ring-inset rounded px-1';
	const unselectedStyles = 'text-muted-foreground';
</script>

<p class="text-sm text-muted-foreground">
	You were listening to
	{#if isDifferentSong}
		<span class="inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
			{#if streamUrlA}
				<Anchor
					href={streamUrlA}
					class="text-primary hover:underline {selected === 'a'
						? selectedStyles
						: unselectedStyles}"
				>
					{labelA}
				</Anchor>
			{:else}
				<span
					class:font-medium={selected === 'a'}
					class:text-foreground={selected === 'a'}
					class:text-muted-foreground={selected !== 'a'}
					class:ring-1={selected === 'a'}
					class:ring-primary={selected === 'a'}
					class:ring-inset={selected === 'a'}
					class:rounded={selected === 'a'}
					class:px-1={selected === 'a'}
				>
					{labelA}
				</span>
			{/if}
			<span class="text-muted-foreground">vs</span>
			{#if streamUrlB}
				<Anchor
					href={streamUrlB}
					class="text-primary hover:underline {selected === 'b'
						? selectedStyles
						: unselectedStyles}"
				>
					{labelB}
				</Anchor>
			{:else}
				<span
					class:font-medium={selected === 'b'}
					class:text-foreground={selected === 'b'}
					class:text-muted-foreground={selected !== 'b'}
					class:ring-1={selected === 'b'}
					class:ring-primary={selected === 'b'}
					class:ring-inset={selected === 'b'}
					class:rounded={selected === 'b'}
					class:px-1={selected === 'b'}
				>
					{labelB}
				</span>
			{/if}
		</span>
	{:else if streamUrlA}
		<Anchor href={streamUrlA} class="font-medium text-foreground text-primary hover:underline">
			{labelA}
		</Anchor>
	{:else}
		<span class="font-medium text-foreground">{labelA}</span>
	{/if}
</p>
