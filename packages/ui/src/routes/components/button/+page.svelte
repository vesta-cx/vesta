<script lang="ts">
	import { Button } from '@/ui/button/index.js';
	import { Badge } from '@/ui/badge/index.js';
	import {
		AltArrowRight as ChevronRightIcon,
		ArrowUp as ArrowUpIcon,
		Letter as MailIcon,
		Refresh as Loader2Icon
	} from '@solar-icons/svelte/Linear';
	import DemoBlock from '../demo-block.svelte';
</script>

<!-- Hero header — mirrors shadcn-svelte/docs layout -->
<header class="flex flex-col gap-3 border-b pb-8">
	<div class="flex items-center gap-2">
		<h1 class="text-4xl font-semibold tracking-tight">Button</h1>
		<Badge variant="secondary">Stable</Badge>
	</div>
	<p class="max-w-2xl text-muted-foreground">
		Displays a button or a component that looks like a button.
	</p>
	<div class="mt-4 flex min-h-40 items-center justify-center rounded-lg border bg-card p-10">
		<div class="flex flex-wrap items-center gap-2 md:flex-row">
			<Button variant="outline">Button</Button>
			<Button variant="outline" size="icon" aria-label="Submit">
				<ArrowUpIcon />
			</Button>
		</div>
	</div>
</header>

<!-- Examples -->
<section class="flex flex-col gap-8">
	<h2 class="text-2xl font-semibold tracking-tight">Examples</h2>

	<DemoBlock title="Default" code={`<Button>Button</Button>`}>
		{#snippet preview()}
			<Button>Button</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock title="Outline" code={`<Button variant="outline">Button</Button>`}>
		{#snippet preview()}
			<Button variant="outline">Button</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock title="Secondary" code={`<Button variant="secondary">Button</Button>`}>
		{#snippet preview()}
			<Button variant="secondary">Button</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock title="Ghost" code={`<Button variant="ghost">Button</Button>`}>
		{#snippet preview()}
			<Button variant="ghost">Button</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock title="Destructive" code={`<Button variant="destructive">Button</Button>`}>
		{#snippet preview()}
			<Button variant="destructive">Button</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock title="Link" code={`<Button variant="link">Button</Button>`}>
		{#snippet preview()}
			<Button variant="link">Button</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock
		title="Icon"
		description="Icon-only buttons need an aria-label for screen readers."
		code={`<Button variant="outline" size="icon" aria-label="Submit">
  <ArrowUpIcon />
</Button>`}
	>
		{#snippet preview()}
			<Button variant="outline" size="icon" aria-label="Submit">
				<ArrowUpIcon />
			</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock
		title="With Icon"
		code={`<Button variant="outline">
  <MailIcon /> Login with Email
</Button>`}
	>
		{#snippet preview()}
			<Button variant="outline">
				<MailIcon /> Login with Email
			</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock
		title="Spinner"
		description="Disabled state with a spinning loader."
		code={`<Button disabled>
  <Loader2Icon class="animate-spin" />
  Please wait
</Button>`}
	>
		{#snippet preview()}
			<Button disabled>
				<Loader2Icon class="animate-spin" />
				Please wait
			</Button>
		{/snippet}
	</DemoBlock>

	<DemoBlock
		title="Size"
		description="Three text sizes (sm, default, lg) and three icon sizes (icon-sm, icon, icon-lg)."
		code={`<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>

<Button size="icon-sm" variant="outline" aria-label="Next"><ChevronRightIcon /></Button>
<Button size="icon" variant="outline" aria-label="Next"><ChevronRightIcon /></Button>
<Button size="icon-lg" variant="outline" aria-label="Next"><ChevronRightIcon /></Button>`}
	>
		{#snippet preview()}
			<div class="flex flex-wrap items-center gap-3">
				<Button size="sm">Small</Button>
				<Button>Default</Button>
				<Button size="lg">Large</Button>
				<span class="mx-2 h-6 w-px bg-border" aria-hidden="true"></span>
				<Button size="icon-sm" variant="outline" aria-label="Next">
					<ChevronRightIcon />
				</Button>
				<Button size="icon" variant="outline" aria-label="Next">
					<ChevronRightIcon />
				</Button>
				<Button size="icon-lg" variant="outline" aria-label="Next">
					<ChevronRightIcon />
				</Button>
			</div>
		{/snippet}
	</DemoBlock>

	<DemoBlock
		title="As link"
		description="Pass an href to render as an anchor. Disabled state is mirrored via aria-disabled."
		code={`<Button href="/components">Home</Button>
<Button href="/components" variant="outline">Outline link</Button>
<Button href="/components" disabled>Disabled link</Button>`}
	>
		{#snippet preview()}
			<div class="flex flex-wrap items-center gap-3">
				<Button href="/components">Home</Button>
				<Button href="/components" variant="outline">Outline link</Button>
				<Button href="/components" disabled>Disabled link</Button>
			</div>
		{/snippet}
	</DemoBlock>
</section>
