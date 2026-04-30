<script lang="ts" module>
	import type { AuthFactor, AuthTotpEnrollment } from '@vesta-cx/auth';

	export type SecuritySettingsData = {
		unavailable: boolean;
		authFactors: AuthFactor[];
	};
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '@vesta-cx/ui/components/ui/button';
	import { Input } from '@vesta-cx/ui/components/ui/input';
	import { Label } from '@vesta-cx/ui/components/ui/label';
	import { IN_DEVELOPMENT_TOOLTIP } from '$lib/components/dashboard/nav-collapsible.svelte';
	import ActionRow from './action-row.svelte';

	let {
		security,
		email,
		emailVerified
	}: {
		security: SecuritySettingsData;
		email: string;
		emailVerified: boolean;
	} = $props();

	let mode = $state<'overview' | 'password' | 'totp' | 'passkeys'>('overview');
	let saving = $state(false);
	let saved = $state(false);
	let busyFactorId = $state<string | null>(null);
	let enrollment = $state<AuthTotpEnrollment | null>(null);
	let message = $state<string | null>(null);
	let errors = $state<Record<string, string[] | undefined> | null>(null);

	const totpFactors = $derived(security.authFactors.filter((factor) => factor.type === 'totp'));
	const hasTotp = $derived(totpFactors.length > 0);

	const fieldError = (key: string) => errors?.[key]?.[0] ?? null;
	const resetPasswordForm = () => {
		saving = false;
		errors = null;
		message = null;
	};
	const showFailure = (data: unknown) => {
		const payload = data as { errors?: typeof errors; message?: string } | undefined;
		errors = payload?.errors ?? null;
		message = payload?.message ?? null;
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
					showFailure(result.data);
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
{:else if mode === 'totp'}
	<div class="space-y-6">
		<header class="space-y-1">
			<h2 class="text-lg font-semibold">Authenticator app</h2>
			<p class="text-sm text-muted-foreground">
				Manage time-based one-time passwords stored in WorkOS.
			</p>
		</header>

		{#if security.unavailable}
			<p class="text-sm text-destructive">Security methods are temporarily unavailable.</p>
		{:else}
			<div class="space-y-3">
				{#if totpFactors.length === 0}
					<p class="text-sm text-muted-foreground">No authenticator app is enrolled.</p>
				{:else}
					<ul class="divide-y rounded-md border">
						{#each totpFactors as factor (factor.id)}
							<li class="flex items-center justify-between gap-3 px-3 py-2.5">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{factor.totp.issuer}</p>
									<p class="truncate text-xs text-muted-foreground">{factor.totp.user}</p>
								</div>
								<form
									method="post"
									action="/dashboard?/deleteAuthFactor"
									use:enhance={() => {
										busyFactorId = factor.id;
										message = null;
										return async ({ result, update }) => {
											busyFactorId = null;
											if (result.type === 'success') {
												await update({ reset: true, invalidateAll: true });
											} else if (result.type === 'failure') {
												showFailure(result.data);
											}
										};
									}}
								>
									<input type="hidden" name="factorId" value={factor.id} />
									<Button variant="outline" size="sm" disabled={busyFactorId === factor.id}>
										{busyFactorId === factor.id ? 'Removing…' : 'Remove'}
									</Button>
								</form>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			{#if enrollment}
				<div class="space-y-3 rounded-md border p-3">
					<div>
						<p class="text-sm font-medium">Finish setup in your authenticator app</p>
						<p class="text-xs text-muted-foreground">
							Scan the QR code or enter the secret manually.
						</p>
					</div>
					{#if enrollment.factor.totp.qrCode}
						<img
							src={enrollment.factor.totp.qrCode}
							alt="Authenticator app setup QR code"
							class="size-36 rounded-md border bg-white p-2"
						/>
					{/if}
					{#if enrollment.factor.totp.secret}
						<code class="block break-all rounded bg-muted px-2 py-1 text-xs">
							{enrollment.factor.totp.secret}
						</code>
					{/if}
					<form
						method="post"
						action="/dashboard?/verifyTotpEnrollment"
						use:enhance={() => {
							saving = true;
							errors = null;
							message = null;
							return async ({ result, update }) => {
								saving = false;
								if (result.type === 'success') {
									enrollment = null;
									await update({ reset: true, invalidateAll: true });
								} else if (result.type === 'failure') {
									console.error('[security-settings] TOTP verification failed', result.data);
									showFailure(result.data);
								}
							};
						}}
						class="space-y-2"
					>
						<input type="hidden" name="factorId" value={enrollment.factor.id} />
						<input type="hidden" name="challengeId" value={enrollment.challenge.id} />
						<Label for="security-totp-code">Verification code</Label>
						<div class="flex gap-2">
							<Input
								id="security-totp-code"
								name="code"
								inputmode="numeric"
								autocomplete="one-time-code"
								placeholder="123456"
								required
							/>
							<Button type="submit" disabled={saving}>{saving ? 'Verifying…' : 'Verify'}</Button>
						</div>
						{#if fieldError('code')}
							<p class="text-xs text-destructive">{fieldError('code')}</p>
						{/if}
					</form>
				</div>
			{/if}

			{#if message}
				<p class="text-sm text-destructive">{message}</p>
			{/if}

			<div class="flex items-center justify-between gap-3">
				<Button type="button" variant="ghost" onclick={() => (mode = 'overview')}>Back</Button>
				<form
					method="post"
					action="/dashboard?/enrollTotp"
					use:enhance={() => {
						saving = true;
						message = null;
						return async ({ result, update }) => {
							saving = false;
							if (result.type === 'success') {
								const data = result.data as { enrollment?: AuthTotpEnrollment } | undefined;
								enrollment = data?.enrollment ?? null;
								await update({ reset: true, invalidateAll: true });
							} else if (result.type === 'failure') {
								showFailure(result.data);
							}
						};
					}}
				>
					<Button type="submit" disabled={saving}>{saving ? 'Starting…' : 'Add authenticator'}</Button>
				</form>
			</div>
		{/if}
	</div>
{:else if mode === 'passkeys'}
	<div class="space-y-6">
		<header class="space-y-1">
			<h2 class="text-lg font-semibold">Passkeys</h2>
			<p class="text-sm text-muted-foreground">
				WorkOS currently exposes passkey enrollment through hosted AuthKit only.
			</p>
		</header>

		<div class="rounded-md border p-3 text-sm text-muted-foreground">
			Passkeys count as a first and second factor when AuthKit verifies user presence, but the
			WorkOS API does not expose custom passkey listing, deletion, or enrollment endpoints yet.
		</div>

		<div class="flex justify-start">
			<Button type="button" variant="ghost" onclick={() => (mode = 'overview')}>Back</Button>
		</div>
	</div>
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
				title="Authenticator app"
				description={hasTotp
					? `${totpFactors.length} TOTP ${totpFactors.length === 1 ? 'factor' : 'factors'} enabled.`
					: 'Use one-time codes from an authenticator app.'}
			>
				{#snippet action()}
					<Button
						variant="outline"
						size="sm"
						disabled={security.unavailable}
						onclick={() => (mode = 'totp')}
					>
						Manage
					</Button>
				{/snippet}
			</ActionRow>

			<ActionRow
				title="Passkeys"
				description="Hosted AuthKit handles passkey enrollment and sign-in."
			>
				{#snippet action()}
					<Button variant="outline" size="sm" onclick={() => (mode = 'passkeys')}>Manage</Button>
				{/snippet}
			</ActionRow>

			<ActionRow
				title="Email verification"
				description={emailVerified ? `${email} is verified.` : `${email} is not verified yet.`}
			>
				{#snippet action()}
					<span class="text-xs text-muted-foreground">{emailVerified ? 'Enabled' : 'Pending'}</span>
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
