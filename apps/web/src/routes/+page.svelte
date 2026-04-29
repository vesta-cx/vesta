<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
</script>

<svelte:head>
	<title>Vesta</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-6 px-6 py-16">
	<div class="space-y-3">
		<p class="text-sm font-medium text-muted-foreground">Vesta CX</p>
		<h1 class="text-4xl font-semibold tracking-tight md:text-5xl">Customer experience workspace.</h1>
		<p class="max-w-2xl text-lg text-muted-foreground">
			Create, organize, and share product resources from one authenticated workspace.
		</p>
	</div>

	<Button href="/dashboard">Open dashboard</Button>
</main>
