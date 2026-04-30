<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { Textarea } from '@vesta-cx/ui/components/ui/textarea';
	import {
		USER_HANDLE_MAX_LENGTH,
		USER_HANDLE_MIN_LENGTH,
		sanitizeMultiLine,
		sanitizeSingleLine,
		sanitizeUserHandle
	} from '@vesta-cx/db/entity-schemas';

	type Props = {
		displayName?: string | null;
		handle?: string | null;
		bio?: string | null;
	};

	let { displayName = '', handle = '', bio = '' }: Props = $props();

	let handleValue = $state(handle ?? '');
	let displayNameValue = $state(displayName ?? '');
	let bioValue = $state(bio ?? '');

	let saving = $state(false);
	let saved = $state(false);
	let errors = $state<Record<string, string[] | undefined> | null>(null);

	const handlePreview = $derived(handleValue.trim() || 'handle');
	const fieldError = (key: string) => errors?.[key]?.[0] ?? null;

	// Mirrors USER_HANDLE_PATTERN in @vesta-cx/db/entity-schemas. Used on the
	// native input as a belt-and-suspenders submit-time check.
	const HANDLE_PATTERN = '[a-z0-9](?:[a-z0-9_\\-]*[a-z0-9])?';

	/**
	 * Sanitize-as-you-type. Each handler filters the candidate value through
	 * the same predicate the server uses (sanitize{...} from
	 * @vesta-cx/db/entity-schemas) and writes it back to both the DOM and the
	 * bound state. Resetting the DOM value preserves form-data integrity if
	 * the user pastes disallowed characters.
	 */
	const sanitize = (
		event: Event & { currentTarget: HTMLInputElement | HTMLTextAreaElement },
		fn: (input: string) => string,
		bind: (next: string) => void
	) => {
		const next = fn(event.currentTarget.value);
		if (next !== event.currentTarget.value) {
			event.currentTarget.value = next;
		}
		bind(next);
	};
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
			value={displayNameValue}
			oninput={(event) => sanitize(event, sanitizeSingleLine, (next) => (displayNameValue = next))}
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
			value={handleValue}
			oninput={(event) => sanitize(event, sanitizeUserHandle, (next) => (handleValue = next))}
			maxlength={USER_HANDLE_MAX_LENGTH}
			minlength={USER_HANDLE_MIN_LENGTH}
			pattern={HANDLE_PATTERN}
			inputmode="url"
			placeholder="yourname"
			autocomplete="off"
			autocapitalize="off"
			spellcheck={false}
		/>
		<p class="text-xs text-muted-foreground">
			Lowercase letters, numbers, hyphens, or underscores. Your public profile lives at
			<span class="font-mono">vesta.cx/user/{handlePreview}</span>.
		</p>
		{#if fieldError('handle')}
			<p class="text-xs text-destructive">{fieldError('handle')}</p>
		{/if}
	</div>

	<div class="space-y-1.5">
		<Label for="profile-bio">Bio</Label>
		<Textarea
			id="profile-bio"
			name="bio"
			value={bioValue}
			oninput={(event) => sanitize(event, sanitizeMultiLine, (next) => (bioValue = next))}
			rows={4}
			maxlength={500}
		/>
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
