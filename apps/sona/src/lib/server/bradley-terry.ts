/**
 * Bradley-Terry model: iterative MLE to compute strength parameters
 * from pairwise comparison data.
 *
 * Given pairs (i wins over j), estimate strength[i] for each item.
 * Higher strength = more preferred.
 */
export const computeBradleyTerry = (
	comparisons: Array<{ winner: string; loser: string }>,
	items: string[],
	iterations = 50
): Record<string, number> => {
	// Initialize all strengths to 1
	const strength: Record<string, number> = {};
	for (const item of items) {
		strength[item] = 1.0;
	}

	if (comparisons.length === 0) return strength;

	// Count wins and appearances
	const wins: Record<string, number> = {};
	const pairCounts: Record<string, Record<string, number>> = {};

	for (const item of items) {
		wins[item] = 0;
		pairCounts[item] = {};
	}

	for (const { winner, loser } of comparisons) {
		wins[winner] = (wins[winner] ?? 0) + 1;
		pairCounts[winner] = pairCounts[winner] ?? {};
		pairCounts[winner][loser] = (pairCounts[winner][loser] ?? 0) + 1;
		pairCounts[loser] = pairCounts[loser] ?? {};
		pairCounts[loser][winner] = (pairCounts[loser][winner] ?? 0) + 1;
	}

	// Iterative update
	for (let iter = 0; iter < iterations; iter++) {
		const newStrength: Record<string, number> = {};

		for (const item of items) {
			const w = wins[item] ?? 0;
			if (w === 0) {
				newStrength[item] = 0.001; // Avoid zero
				continue;
			}

			let denominator = 0;
			const pairs = pairCounts[item] ?? {};
			for (const [opponent, pairCount] of Object.entries(pairs)) {
				const si = strength[item] ?? 1;
				const sj = strength[opponent] ?? 1;
				denominator += pairCount / (si + sj);
			}

			newStrength[item] = denominator > 0 ? w / denominator : 0.001;
		}

		// Normalize so strengths sum to items.length
		const total = Object.values(newStrength).reduce((a, b) => a + b, 0);
		const scale = items.length / total;
		for (const item of items) {
			strength[item] = (newStrength[item] ?? 0) * scale;
		}
	}

	return strength;
};
