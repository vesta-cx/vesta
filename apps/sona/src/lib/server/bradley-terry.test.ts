import { describe, expect, it } from 'vitest';
import { computeBradleyTerry } from './bradley-terry';

describe('computeBradleyTerry', () => {
	it('returns equal strengths when no comparisons', () => {
		const items = ['a', 'b', 'c'];
		const scores = computeBradleyTerry([], items);
		expect(scores).toEqual({ a: 1, b: 1, c: 1 });
	});

	it('ranks clear winner higher when one item wins all', () => {
		const items = ['a', 'b', 'c'];
		const comparisons = [
			{ winner: 'a', loser: 'b' },
			{ winner: 'a', loser: 'c' }
		];
		const scores = computeBradleyTerry(comparisons, items, 50);
		expect(scores.a).toBeGreaterThan(scores.b);
		expect(scores.a).toBeGreaterThan(scores.c);
	});

	it('normalizes strengths to sum to items.length', () => {
		const items = ['a', 'b'];
		const comparisons = [{ winner: 'a', loser: 'b' }];
		const scores = computeBradleyTerry(comparisons, items, 50);
		const total = Object.values(scores).reduce((a, b) => a + b, 0);
		expect(total).toBeCloseTo(items.length, 5);
	});
});
