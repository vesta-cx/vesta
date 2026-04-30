<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { Textarea } from '@vesta-cx/ui/components/ui/textarea';

	type Props = {
		displayName?: string | null;
		handle?: string | null;
		bio?: string | null;
	};

	let { displayName = '', handle = '', bio = '' }: Props = $props();

	let saving = $state(false);
	let saved = $state(false);
	let errors = $state<Record<string, string[] | undefined> | null>(null);

	let handleValue = $state(handle ?? '');
	const handlePreview = $derived(handleValue.trim() || 'handle');

	const fieldError = (key: string) => errors?.[key]?.[0] ?? null;
</script>

<form
	method="post"
	action="/dashboard?/updateProfile"
	use:enhance={() => {
		saving = true;
		saved = false;
		errors = null;
		return async ({ result, update }) => {
			saving = false;
			if (result.type === 'success') {
				saved = true;
				await update({ reset: false, invalidateAll: true });
			} else if (result.type === 'failure') {
				const data = result.data as { errors?: typeof errors } | undefined;
				errors = data?.errors ?? null;
			}
		};
	}}
	class="space-y-6"
>
	<header class="space-y-1">
		<h2 class="text-lg font-semibold">Profile</h2>
		<p class="text-sm text-muted-foreground">How you appear publicly on Vesta.</p>
	</header>

	<div class="space-y-1.5">
		<Label for="profile-display-name">Display name</Label>
		<Input
			id="profile-display-name"
			name="displayName"
			value={displayName ?? ''}
			maxlength={80}
		/>
		{#if fieldError('displayName')}
			<p class="text-xs text-destructive">{fieldError('displayName')}</p>
		{/if}
	</div>

	<div class="space-y-1.5">
		<Label for="profile-handle">Handle</Label>
		<Input
			id="profile-handle"
			name="handle"
			bind:value={handleValue}
			maxlength={32}
			placeholder="yourname"
			autocomplete="off"
			autocapitalize="off"
			spellcheck={false}
		/>
		<p class="text-xs text-muted-foreground">
			Your public profile lives at
			<span class="font-mono">vesta.cx/user/{handlePreview}</span>.
		</p>
		{#if fieldError('handle')}
			<p class="text-xs text-destructive">{fieldError('handle')}</p>
		{/if}
	</div>

	<div class="space-y-1.5">
		<Label for="profile-bio">Bio</Label>
		<Textarea id="profile-bio" name="bio" value={bio ?? ''} rows={4} maxlength={500} />
		{#if fieldError('bio')}
			<p class="text-xs text-destructive">{fieldError('bio')}</p>
		{/if}
	</div>

	<div class="flex items-center justify-end gap-3">
		{#if saved && !saving}
			<span class="text-xs text-muted-foreground">Saved</span>
		{/if}
		<Button type="submit" disabled={saving}>
			{saving ? 'Saving…' : 'Save changes'}
		</Button>
	</div>
</form>
