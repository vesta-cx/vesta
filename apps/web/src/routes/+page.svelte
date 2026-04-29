<script lang="ts">
	import { Button } from '@vesta-cx/ui/components/ui/button';
</script>

<svelte:head>
	<title>Vesta</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-8 px-6 py-16">
	<div class="space-y-3">
		<p class="text-sm font-medium text-muted-foreground">Vesta CX</p>
		<h1 class="text-4xl font-semibold tracking-tight md:text-5xl">
			Customer experience workspace.
		</h1>
		<p class="max-w-2xl text-lg text-muted-foreground">
			Two dashboard variants for review. Pick the one to harden into the real shell.
		</p>
	</div>

	<div class="flex flex-wrap gap-3">
		<Button href="/dashboard">Variant A — sidebar-07</Button>
		<Button variant="outline" href="/dashboard-2">Variant B — sidebar-08</Button>
	</div>
</main>
