<script lang="ts">
	import { Badge } from '@vesta-cx/ui/components/ui/badge';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import * as Card from '@vesta-cx/ui/components/ui/card';
	import LibraryIcon from '@lucide/svelte/icons/library';
	import MicIcon from '@lucide/svelte/icons/mic-2';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	const variants = [
		{
			href: '/dashboard',
			persona: 'DIY artist · solo creator',
			title: 'Creator view',
			body: 'Sidebar-07 shape. Releases, smart links, posts, profile, audience, insights. The default home for one artist running their own release marketing.',
			icon: MicIcon,
			tag: 'Variant A'
		},
		{
			href: '/dashboard-2',
			persona: 'Small label · artist manager',
			title: 'Label view',
			body: 'Sidebar-08 shape with a roster section, release calendar across artists, campaign templates, and a full secondary rail for members, permissions, and billing.',
			icon: LibraryIcon,
			tag: 'Variant B'
		},
		{
			href: '/dashboard-3',
			persona: 'Active release week',
			title: 'Campaign cockpit',
			body: 'A different shape entirely: the in-flight release pins to the sidebar and dominates the canvas — pre-save progress, smart-link routes, timeline, audience momentum.',
			icon: SparklesIcon,
			tag: 'Variant C'
		}
	];
</script>

<svelte:head>
	<title>Vesta · dashboard variants</title>
</svelte:head>

<main class="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16">
	<header class="flex flex-col gap-4">
		<Badge variant="outline" class="w-fit">Internal · design review</Badge>
		<h1 class="text-4xl font-semibold tracking-tight md:text-5xl">
			Release marketing dashboards.
		</h1>
		<p class="max-w-3xl text-lg text-muted-foreground">
			Three dashboard shapes, each tuned to a real Vesta persona — DIY artists, small
			labels, and live release cycles. Pick one to harden into the actual app shell, or mix
			pieces.
		</p>
	</header>

	<div class="grid gap-4 md:grid-cols-3">
		{#each variants as variant (variant.href)}
			<Card.Root class="flex flex-col">
				<Card.Header class="space-y-3">
					<div class="flex items-center justify-between">
						<div
							class="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"
						>
							<variant.icon class="size-5" />
						</div>
						<Badge variant="secondary">{variant.tag}</Badge>
					</div>
					<div class="space-y-1">
						<Card.Title>{variant.title}</Card.Title>
						<p class="text-sm text-muted-foreground">{variant.persona}</p>
					</div>
				</Card.Header>
				<Card.Content class="flex flex-1 flex-col justify-between gap-4">
					<p class="text-sm text-muted-foreground">{variant.body}</p>
					<Button href={variant.href} class="w-full">Open {variant.title.toLowerCase()}</Button>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>

	<footer class="text-sm text-muted-foreground">
		Vesta is release-marketing infrastructure for independent music: smart links, branded
		release pages, artist/label profiles, and campaign posts in one place.
	</footer>
</main>
