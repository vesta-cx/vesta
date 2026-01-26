// lib/utils/slot-context.ts
import { getContext, setContext, type Snippet } from 'svelte';

export interface SlotContext<T extends string> {
	register: (slot: T, snippet: Snippet) => void;
}

type Slots<T extends string> = Record<T, Snippet | undefined>;

export const setSlotContext = <T extends string>(contextKey: string) => {
	const slots = $state<Slots<T>>({} as Slots<T>);

	const ctx: SlotContext<T> = {
		register: (slot, snippet) => {
			slots[slot] = snippet;
		}
	};

	setContext(contextKey, ctx);

	return new Proxy({} as Slots<T>, {
		get: (_, prop: string) => slots[prop as T]
	});
};

export const getSlotContext = <T extends string>(contextKey: string) => {
	return getContext<SlotContext<T>>(contextKey);
};