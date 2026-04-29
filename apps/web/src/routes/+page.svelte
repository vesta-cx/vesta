<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
</script>

<svelte:head>
	<title>Vesta</title>
</svelte:head>

<main
	class="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-start justify-center gap-6 px-6 py-16"
>
	<div class="space-y-3">
		<p class="text-sm font-medium text-muted-foreground">Vesta</p>
		<h1 class="text-4xl font-semibold tracking-tight md:text-5xl">
			Release marketing for independent music.
		</h1>
		<p class="max-w-2xl text-lg text-muted-foreground">
			Smart links, branded release pages, artist and label profiles, and campaign posts in
			one place.
		</p>
	</div>

	<Button href="/dashboard">Open dashboard</Button>
</main>
