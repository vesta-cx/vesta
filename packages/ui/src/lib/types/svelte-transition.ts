import type { TransitionConfig } from 'svelte/transition';

export type TransitionFunction = (
	node: HTMLElement,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	params: any,
	options: { direction: 'in' | 'out' | 'both' }
) => TransitionConfig;
