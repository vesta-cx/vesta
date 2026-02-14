<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	interface Props extends WithElementRef<HTMLAttributes<HTMLDivElement>> {
		label: string;
		value?: string | number;
		helper?: string;
		colSpan?: string;
		children?: import("svelte").Snippet;
	}

	let {
		ref = $bindable(null),
		class: className,
		label,
		value,
		helper,
		colSpan,
		children,
		...restProps
	}: Props = $props();
</script>

<div
	bind:this={ref}
	class={cn(
		"bg-card rounded-xl border p-6",
		colSpan,
		className
	)}
	{...restProps}
>
	<h3 class="text-muted-foreground text-sm font-medium">{label}</h3>
	{#if children}
		{#if helper}
			<p class="text-muted-foreground mt-1 text-xs">{helper}</p>
		{/if}
		<div class="mt-4">
			{@render children?.()}
		</div>
	{:else if value !== undefined}
		<p class="mt-2 text-4xl font-bold tracking-tight">
			{typeof value === "number" ? value.toLocaleString() : value}
		</p>
		{#if helper}
			<p class="text-muted-foreground mt-1 text-xs">{helper}</p>
		{/if}
	{/if}
</div>
