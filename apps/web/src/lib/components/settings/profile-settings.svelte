<script lang="ts">
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { Separator } from '@vesta-cx/ui/components/ui/separator';
	import { Textarea } from '@vesta-cx/ui/components/ui/textarea';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';

	type Props = {
		displayName?: string;
		handle?: string;
		bio?: string;
	};

	let { displayName = '', handle = '', bio = '' }: Props = $props();
</script>

<div class="space-y-6">
	<header class="space-y-1">
		<h2 class="text-lg font-semibold">Profile</h2>
		<p class="text-sm text-muted-foreground">
			How you appear publicly on Vesta. Distinct from your account identity (legal name,
			email).
		</p>
	</header>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Display name</h3>
			<p class="text-xs text-muted-foreground">Shown next to your activity across Vesta.</p>
		</header>
		<div class="space-y-1.5">
			<Label for="profile-display-name">Display name</Label>
			<Input
				id="profile-display-name"
				value={displayName}
				disabled
				title={IN_DEVELOPMENT_TOOLTIP}
			/>
		</div>
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Handle</h3>
			<p class="text-xs text-muted-foreground">
				Your public URL: <span class="font-mono">vesta.cx/@{handle || 'handle'}</span>
			</p>
		</header>
		<div class="space-y-1.5">
			<Label for="profile-handle">Handle</Label>
			<Input id="profile-handle" value={handle} disabled title={IN_DEVELOPMENT_TOOLTIP} />
		</div>
	</section>

	<Separator />

	<section class="space-y-4">
		<header class="space-y-0.5">
			<h3 class="text-sm font-medium">Bio</h3>
			<p class="text-xs text-muted-foreground">A short description for your public profile.</p>
		</header>
		<div class="space-y-1.5">
			<Label for="profile-bio">Bio</Label>
			<Textarea
				id="profile-bio"
				value={bio}
				rows={4}
				disabled
				title={IN_DEVELOPMENT_TOOLTIP}
			/>
		</div>
	</section>
</div>
