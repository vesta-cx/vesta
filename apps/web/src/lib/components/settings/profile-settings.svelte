<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import { Spinner } from '@vesta-cx/ui/components/ui/spinner';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { Textarea } from '@vesta-cx/ui/components/ui/textarea';
	import SettingsHeading from './settings-heading.svelte';
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
	let handleAvailability = $state<{
		state: 'idle' | 'checking' | 'available' | 'unavailable';
		reason?: string | null;
	}>({ state: 'idle' });

	const handlePreview = $derived(handleValue.trim() || 'handle');
	const handleChanged = $derived(handleValue.trim() !== (handle ?? '').trim());
	const handleStatus = $derived(
		handleChanged && handleAvailability.state === 'available'
			? { icon: CircleCheckIcon, label: 'Available', class: 'text-emerald-500' }
			: handleChanged && handleAvailability.state === 'unavailable'
				? { icon: CircleXIcon, label: 'Not available', class: 'text-destructive' }
				: handleChanged && handleAvailability.state === 'checking'
					? { icon: Spinner, label: 'Checking', class: 'text-muted-foreground' }
					: null
	);
	const fieldError = (key: string) => errors?.[key]?.[0] ?? null;

	// Mirrors USER_HANDLE_PATTERN in @vesta-cx/db/entity-schemas. Used on the
	// native input as a belt-and-suspenders submit-time check.
	const HANDLE_PATTERN = '[A-Za-z0-9](?:[A-Za-z0-9_\\-]*[A-Za-z0-9])?';

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

	$effect(() => {
		const handle = handleValue.trim();
		if (!handleChanged || !handle) {
			handleAvailability = { state: 'idle' };
			return;
		}

		handleAvailability = { state: 'checking' };
		const controller = new AbortController();
		const timeout = window.setTimeout(async () => {
			try {
				const response = await fetch(
					`/dashboard/handle-availability?handle=${encodeURIComponent(handle)}`,
					{ signal: controller.signal }
				);
				const result = (await response.json()) as {
					available?: boolean;
					reason?: string | null;
				};
				handleAvailability = {
					state: result.available ? 'available' : 'unavailable',
					reason: result.reason ?? null
				};
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') return;
				handleAvailability = { state: 'idle' };
			}
		}, 250);

		return () => {
			controller.abort();
			window.clearTimeout(timeout);
		};
	});
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
	<SettingsHeading
		section="Profile"
		title="Profile"
		description="How you appear publicly on Vesta."
	/>

	<div class="flex items-center gap-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
		<Spinner class="size-10 [--spinner-duration:5s]" aria-label="Debug loading animation" />
		<span>Spinner debug</span>
	</div>

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
		<div class="grid min-h-5 grid-cols-[1fr_auto] items-center gap-3">
			<Label for="profile-handle">Handle</Label>
			<p class="text-xs text-muted-foreground" aria-live="polite">
				{handleStatus?.label ?? ''}
			</p>
		</div>
		<div class="flex items-center rounded-md border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30">
			<span class="ps-3 text-sm text-muted-foreground">@</span>
			<Input
				id="profile-handle"
				class="border-0 bg-transparent ps-1 shadow-none focus-visible:ring-0 dark:bg-transparent"
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
			{#if handleStatus}
				<handleStatus.icon class={`me-3 size-4 shrink-0 ${handleStatus.class}`} />
			{/if}
		</div>
		<p class="text-xs text-muted-foreground">
			Letters, numbers, hyphens, or underscores. Capitalization is for display only; handle
			availability ignores case. Your public profile lives at
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
