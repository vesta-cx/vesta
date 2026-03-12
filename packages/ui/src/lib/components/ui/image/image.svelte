<script lang="ts">
	import type { Prettify } from '@vesta-cx/utils';
	import { onMount } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type BaseImageProps = {
		alt: string;
		class?: string;
	};

	type ImageSrcProps =
		| {
				src: string;
				srcset?: never;
		  }
		| {
				srcset: string;
				src?: never;
		  };

	type ImageProps = Prettify<HTMLAttributes<HTMLImageElement> & BaseImageProps & ImageSrcProps>;

	let { class: className, src, srcset, alt, ...restProps }: ImageProps = $props();

	onMount(() => {
		console.log('image.svelte mounted');
	});
</script>

{#if src}
	<img {src} {alt} class={className} {...restProps} />
{/if}
{#if srcset}
	<img {srcset} {alt} class={className} {...restProps} />
{/if}

<style>
</style>
