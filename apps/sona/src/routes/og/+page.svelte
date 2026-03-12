<script lang="ts">
	import HeroCanvas from '$lib/components/hero-canvas.svelte';
	import { SITE_NAME, TAGLINE_SHORT, ORG_NAME } from '$lib/constants/identity';
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- OG capture: plain structure so HeroCanvas mounts immediately (no Section slot delay) -->
<div
	class="relative flex min-h-svh flex-col items-center justify-center overflow-hidden"
	data-section="og-hero"
>
	<figure class="pointer-events-none absolute inset-0 -z-10">
		<div class="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-primary/5"></div>
		<HeroCanvas waves={4} particles={96} config={{ yOffset: [0.5, 0.5] }} />
		<div class="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-background"></div>
	</figure>
	<div
		class="relative z-10 container flex flex-col items-center justify-center gap-6 p-6 text-center"
	>
		<h2 class="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{SITE_NAME}</h2>
		<h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
			Can you hear
			<span class="text-primary">the difference?</span>
		</h1>
		<p class="mx-auto max-w-2xl text-lg text-muted-foreground">{TAGLINE_SHORT}</p>
	</div>
	<p class="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm text-muted-foreground">
		by {ORG_NAME}
	</p>
</div>
