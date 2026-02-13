<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Button } from '@/ui/button';
	import { Separator } from '@/ui/separator';
	import { CookieConsentForm } from '$lib/components/utils/cookie-consent-form';
	import CookieIcon from '@lucide/svelte/icons/cookie';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import { fly } from 'svelte/transition';
	import {
		hasConsented,
		acceptAllVendors,
		rejectAllVendors,
	} from '@vesta-cx/utils/cookies';
	import type { VendorDefinition } from '@vesta-cx/utils/cookies';

	type CookieConsentDialogProps = {
		/** List of vendors the app uses. */
		vendors: VendorDefinition[];
		class?: string;
	};

	let { vendors, class: className }: CookieConsentDialogProps = $props();

	let visible = $state(!hasConsented());
	let expanded = $state(false);

	const handleAcceptAll = () => {
		acceptAllVendors(vendors.map((v) => v.id));
		visible = false;
	};

	const handleRejectAll = () => {
		rejectAllVendors();
		visible = false;
	};

	const handleCustomize = () => {
		expanded = true;
	};

	const handleBack = () => {
		expanded = false;
	};

	const handleSaved = () => {
		visible = false;
	};
</script>

{#if visible}
	<div
		class={cn(
			'fixed right-4 bottom-4 z-50 w-[24rem] max-w-[calc(100vw-2rem)] @container',
			className,
		)}
		transition:fly={{ y: 20, duration: 300 }}
		role="dialog"
		aria-label="Cookie consent"
	>
		<div
			class="bg-background border-border overflow-hidden rounded-xl border shadow-lg"
		>
			{#if expanded}
				<!-- Expanded: full form -->
				<div class="p-4">
					<div class="mb-3 flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							class="h-7 w-7 p-0"
							onclick={handleBack}
							aria-label="Back to summary"
						>
							<ChevronLeftIcon class="size-4" />
						</Button>
						<p class="text-sm font-semibold">Cookie preferences</p>
					</div>

					<div class="max-h-[60vh] overflow-y-auto">
						<CookieConsentForm {vendors} onSave={handleSaved} />
					</div>
				</div>
			{:else}
				<!-- Compact: summary + quick actions -->
				<div class="p-4">
					<div class="flex items-start gap-3">
						<div class="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
							<CookieIcon class="text-muted-foreground size-4" />
						</div>
						<div class="min-w-0">
							<p class="text-sm font-semibold">We use cookies</p>
							<p class="text-muted-foreground mt-1 text-xs leading-relaxed">
								We use cookies for essential functionality and, with your consent, for analytics
								and advertising. You can customize your preferences or accept/reject all.
							</p>
						</div>
					</div>

					<Separator class="my-3" />

					<div class="flex flex-wrap gap-2">
						<Button variant="default" size="sm" onclick={handleAcceptAll}>Accept all</Button>
						<Button variant="outline" size="sm" onclick={handleRejectAll}>Reject all</Button>
						<Button variant="ghost" size="sm" onclick={handleCustomize}>Customize</Button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
