<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Switch } from '@/ui/switch';
	import { Button } from '@/ui/button';
	import { Separator } from '@/ui/separator';
	import { Anchor } from '$lib/components/utils/anchor';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import type { Snippet } from 'svelte';
	import {
		consentStore,
		acceptAllVendors,
		rejectAllVendors,
	} from '@vesta-cx/utils/cookies';
	import type { VendorDefinition, VendorConsent } from '@vesta-cx/utils/cookies';

	type CookieConsentFormProps = {
		/** List of vendors the app uses. */
		vendors: VendorDefinition[];
		/** Called after the user saves preferences. */
		onSave?: () => void;
		/** Optional slot for additional content above the form. */
		header?: Snippet;
		class?: string;
	};

	let { vendors, onSave, header, class: className }: CookieConsentFormProps = $props();

	// ── Local draft state (committed on Save) ────────────────────────────────

	let preferences = $state(consentStore.get().preferences === 'true');
	let vendorDraft = $state<Record<string, VendorConsent>>({});

	// Initialize draft from store
	const initDraft = () => {
		const current = consentStore.get();
		preferences = current.preferences === 'true';

		const draft: Record<string, VendorConsent> = {};
		for (const v of vendors) {
			const existing = current.vendors[v.id];
			draft[v.id] = existing
				? { ...existing }
				: { analytics: 'false', advertising: 'false' };
		}
		vendorDraft = draft;
	};

	// Initialize on mount
	initDraft();

	// ── Handlers ─────────────────────────────────────────────────────────────

	const handleSave = () => {
		consentStore.set({
			essential: 'true',
			preferences: preferences ? 'true' : 'false',
			vendors: { ...vendorDraft },
		});
		onSave?.();
	};

	const handleAcceptAll = () => {
		const ids = vendors.map((v) => v.id);
		acceptAllVendors(ids);
		onSave?.();
	};

	const handleRejectAll = () => {
		rejectAllVendors();
		onSave?.();
	};

	const handleToggleVendorPurpose = (vendorId: string, purpose: 'analytics' | 'advertising') => {
		const current = vendorDraft[vendorId];
		if (!current) return;
		vendorDraft[vendorId] = {
			...current,
			[purpose]: current[purpose] === 'true' ? 'false' : 'true',
		};
	};
</script>

<div class={cn('@container', className)}>
	{#if header}
		{@render header()}
	{/if}

	<div class="space-y-4">
		<!-- Essential (always on, not toggleable) -->
		<div class="flex items-center justify-between gap-4">
			<div>
				<p class="text-sm font-medium">Essential cookies</p>
				<p class="text-muted-foreground text-xs">Required for the site to function. Always enabled.</p>
			</div>
			<Switch checked={true} disabled aria-label="Essential cookies — always enabled" />
		</div>

		<Separator />

		<!-- Preferences -->
		<div class="flex items-center justify-between gap-4">
			<div>
				<p class="text-sm font-medium">Preference cookies</p>
				<p class="text-muted-foreground text-xs">
					Remember your settings like theme, language, and layout.
				</p>
			</div>
			<Switch bind:checked={preferences} aria-label="Preference cookies" />
		</div>

		{#if vendors.length > 0}
			<Separator />

			<!-- Vendor list -->
			<div>
				<p class="text-sm font-semibold">Third-party vendors</p>
				<p class="text-muted-foreground mt-0.5 text-xs">
					Control analytics and advertising cookies per vendor.
				</p>
			</div>

			<div class="space-y-3">
				{#each vendors as vendor (vendor.id)}
					{@const draft = vendorDraft[vendor.id]}
					{#if draft}
						<div
							class="bg-muted/40 rounded-lg p-3 @sm:flex @sm:items-start @sm:justify-between @sm:gap-6"
						>
							<!-- Vendor info -->
							<div class="mb-2 min-w-0 @sm:mb-0">
								<div class="flex items-center gap-1.5">
									<p class="text-sm font-medium">{vendor.name}</p>
									{#if vendor.privacyUrl}
										<Anchor
											href={vendor.privacyUrl}
											class="text-muted-foreground hover:text-foreground"
											showIcon={false}
											aria-label="{vendor.name} privacy policy"
										>
											<ExternalLinkIcon class="size-3" />
										</Anchor>
									{/if}
								</div>
								{#if vendor.description}
									<p class="text-muted-foreground text-xs">{vendor.description}</p>
								{/if}
							</div>

							<!-- Purpose toggles -->
							<div class="flex shrink-0 items-center gap-4">
								<label class="flex items-center gap-2 text-xs">
									<Switch
										checked={draft.analytics === 'true'}
										onCheckedChange={() =>
											handleToggleVendorPurpose(vendor.id, 'analytics')}
										aria-label="{vendor.name} analytics"
									/>
									<span class="text-muted-foreground">Analytics</span>
								</label>

								<label class="flex items-center gap-2 text-xs">
									<Switch
										checked={draft.advertising === 'true'}
										onCheckedChange={() =>
											handleToggleVendorPurpose(vendor.id, 'advertising')}
										aria-label="{vendor.name} advertising"
									/>
									<span class="text-muted-foreground">Ads</span>
								</label>
							</div>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<Separator />

		<!-- Actions -->
		<div class="flex flex-wrap gap-2">
			<Button variant="default" size="sm" onclick={handleAcceptAll}>Accept all</Button>
			<Button variant="outline" size="sm" onclick={handleRejectAll}>Reject all</Button>
			<Button variant="secondary" size="sm" onclick={handleSave}>Save preferences</Button>
		</div>
	</div>
</div>
