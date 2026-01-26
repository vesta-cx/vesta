<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { IconProps } from "@lucide/svelte";
	import Loader2Icon from "@lucide/svelte/icons/loader-2";

	let { class: className, ...restProps }: IconProps & { class?: string } = $props();
</script>

<Loader2Icon
	role="status"
	aria-label="Loading"
	class={cn("size-4 animate-spin", className)}
	{...restProps}
/>