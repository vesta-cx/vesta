<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';
	import ActionRow from './action-row.svelte';

	let mode = $state<'overview' | 'password'>('overview');
	let saving = $state(false);
	let saved = $state(false);
	let message = $state<string | null>(null);
	let errors = $state<Record<string, string[] | undefined> | null>(null);

	const fieldError = (key: string) => errors?.[key]?.[0] ?? null;
	const resetPasswordForm = () => {
		saving = false;
		errors = null;
		message = null;
	};
</script>

{#if mode === 'password'}
	<form
		method="post"
		action="/dashboard?/changePassword"
		use:enhance={() => {
			saving = true;
			saved = false;
			errors = null;
			message = null;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					saved = true;
					mode = 'overview';
					await update({ reset: true, invalidateAll: false });
				} else if (result.type === 'failure') {
					const data = result.data as
						| { errors?: typeof errors; message?: string }
						| undefined;
					errors = data?.errors ?? null;
					message = data?.message ?? null;
				}
			};
		}}
		class="space-y-6"
	>
		<header class="space-y-1">
			<h2 class="text-lg font-semibold">Change password</h2>
			<p class="text-sm text-muted-foreground">
				Enter your current password before choosing a new one.
			</p>
		</header>

		<div class="space-y-1.5">
			<Label for="security-current-password">Current password</Label>
			<Input
				id="security-current-password"
				name="currentPassword"
				type="password"
				autocomplete="current-password"
				required
			/>
			{#if fieldError('currentPassword')}
				<p class="text-xs text-destructive">{fieldError('currentPassword')}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<Label for="security-new-password">New password</Label>
			<Input
				id="security-new-password"
				name="newPassword"
				type="password"
				autocomplete="new-password"
				minlength={8}
				maxlength={72}
				required
			/>
			{#if fieldError('newPassword')}
				<p class="text-xs text-destructive">{fieldError('newPassword')}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<Label for="security-confirm-password">Confirm new password</Label>
			<Input
				id="security-confirm-password"
				name="confirmPassword"
				type="password"
				autocomplete="new-password"
				required
			/>
			{#if fieldError('confirmPassword')}
				<p class="text-xs text-destructive">{fieldError('confirmPassword')}</p>
			{/if}
		</div>

		{#if message}
			<p class="text-sm text-destructive">{message}</p>
		{/if}

		<div class="flex items-center justify-between gap-3">
			<Button
				type="button"
				variant="ghost"
				onclick={() => {
					resetPasswordForm();
					mode = 'overview';
				}}
			>
				Cancel
			</Button>
			<Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save password'}</Button>
		</div>
	</form>
{:else}
	<div class="space-y-6">
		<header class="space-y-1">
			<h2 class="text-lg font-semibold">Security</h2>
			<p class="text-sm text-muted-foreground">Sign-in and authentication.</p>
		</header>

		<ul class="divide-y">
			<ActionRow title="Password" description="Change the password used for email sign-in.">
				{#snippet action()}
					<div class="flex items-center gap-3">
						{#if saved}
							<span class="text-xs text-muted-foreground">Saved</span>
						{/if}
						<Button
							variant="outline"
							size="sm"
							onclick={() => {
								resetPasswordForm();
								mode = 'password';
							}}
						>
							Change
						</Button>
					</div>
				{/snippet}
			</ActionRow>

			<ActionRow
				title="Two-factor authentication"
				description="Adds an extra step when signing in. Not enabled."
			>
				{#snippet action()}
					<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
						Enable
					</Button>
				{/snippet}
			</ActionRow>

			<ActionRow
				title="Active sessions"
				description="Sign out of any devices you don't recognize."
			>
				{#snippet action()}
					<Button variant="outline" size="sm" disabled title={IN_DEVELOPMENT_TOOLTIP}>
						Sign out others
					</Button>
				{/snippet}
			</ActionRow>
		</ul>
	</div>
{/if}
