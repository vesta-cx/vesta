<script lang="ts">
	import { formatList, parseList, unescapeToken } from '$lib/utils/list';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		value?: string | null;
		name?: string;
		id?: string;
		placeholder?: string;
	}

	let {
		value = $bindable(''),
		name,
		id,
		placeholder = 'Type and press semicolon or Enter (use \\; for semicolons)'
	}: Props = $props();

	let tags = $state<string[]>(parseList(value));
	let inputValue = $state('');

	$effect(() => {
		const parsed = parseList(value);
		if (JSON.stringify(parsed) !== JSON.stringify(tags)) {
			tags = parsed;
		}
	});

	const syncToValue = () => {
		value = formatList(tags);
	};

	const addCurrent = () => {
		const t = unescapeToken(inputValue.trim());
		if (t) {
			tags = [...tags, t];
			inputValue = '';
			syncToValue();
		}
	};

	const remove = (i: number) => {
		tags = tags.filter((_, j) => j !== i);
		syncToValue();
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.key === ';' || e.key === 'Enter') {
			e.preventDefault();
			addCurrent();
		} else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
			e.preventDefault();
			remove(tags.length - 1);
		}
	};
</script>

<div
	class="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5"
>
	{#each tags as tag, i (tag + i)}
		<span
			class="inline-flex items-center gap-1 rounded-md border border-input bg-muted/50 px-2 py-0.5 text-sm text-foreground"
		>
			{tag}
			<button
				type="button"
				tabindex="-1"
				aria-label="Remove {tag}"
				onclick={() => remove(i)}
				class="-mr-0.5 rounded p-0.5 transition-colors hover:bg-muted"
			>
				<X class="size-3" />
			</button>
		</span>
	{/each}
	<input
		type="text"
		{id}
		{placeholder}
		bind:value={inputValue}
		onkeydown={handleKeyDown}
		onblur={addCurrent}
		class="min-w-24 flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground"
		autocomplete="off"
	/>
</div>
{#if name}
	<input type="hidden" {name} value={formatList(tags)} />
{/if}
