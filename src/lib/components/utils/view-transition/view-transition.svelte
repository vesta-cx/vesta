<script lang="ts">
	import { onNavigate } from '$app/navigation';

	onNavigate((n) => {
		if (!document.startViewTransition) return;

		const transition = new Promise<void>((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await n.complete;
			});
		});

		return transition;
	});
</script>

<!-- ViewTransitionAPI Svelte Component -->

<style lang="scss">
	@media (prefers-reduced-motion) {
		::view-transition-group(*),
		::view-transition-old(*),
		::view-transition-new(*) {
			animation: none !important;
		}
	}
</style>