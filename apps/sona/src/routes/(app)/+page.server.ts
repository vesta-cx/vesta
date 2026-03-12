import { desc, isNotNull } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { resultSnapshots, sourceFiles } from '$lib/server/db/schema';
import { parseList } from '$lib/utils/list';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) {
		return { snapshot: null, contentLibrary: null };
	}

	try {
		const db = getDb(platform);

		const snapshot = await db
			.select()
			.from(resultSnapshots)
			.orderBy(desc(resultSnapshots.createdAt))
			.limit(1)
			.get();

		// Content library stats (approved sources only)
		let contentLibrary: { songCount: number; artistCount: number } | null = null;
		try {
			const approved = await db
				.select({ artist: sourceFiles.artist })
				.from(sourceFiles)
				.where(isNotNull(sourceFiles.approvedAt))
				.all();
			const uniqueArtists = new Set<string>();
			for (const row of approved) {
				for (const a of parseList(row.artist ?? '')) {
					if (a) uniqueArtists.add(a);
				}
			}
			contentLibrary = {
				songCount: approved.length,
				artistCount: uniqueArtists.size
			};
		} catch {
			// source_files may not exist
		}

		return {
			contentLibrary,
			snapshot: snapshot
				? {
						createdAt: snapshot.createdAt?.toISOString() ?? null,
						totalResponses: snapshot.totalResponses,
						totalSessions: snapshot.totalSessions,
						neitherRate: snapshot.neitherRate,
						avgResponseTimeMs: snapshot.avgResponseTimeMs,
						flacWinRate: snapshot.flacWinRate,
						flacComparisons: snapshot.flacComparisons,
						opusWinRate: snapshot.opusWinRate,
						opusComparisons: snapshot.opusComparisons,
						aacWinRate: snapshot.aacWinRate,
						aacComparisons: snapshot.aacComparisons,
						mp3WinRate: snapshot.mp3WinRate,
						mp3Comparisons: snapshot.mp3Comparisons,
						bitrateLosslessWinRate: snapshot.bitrateLosslessWinRate,
						bitrateHighWinRate: snapshot.bitrateHighWinRate,
						bitrateMidWinRate: snapshot.bitrateMidWinRate,
						bitrateLowWinRate: snapshot.bitrateLowWinRate,
						losslessVsLossyLosslessWins: snapshot.losslessVsLossyLosslessWins,
						losslessVsLossyTotal: snapshot.losslessVsLossyTotal,
						opusVsMp3OpusWins: snapshot.opusVsMp3OpusWins,
						opusVsMp3Total: snapshot.opusVsMp3Total,
						aacVsMp3AacWins: snapshot.aacVsMp3AacWins,
						aacVsMp3Total: snapshot.aacVsMp3Total,
						deviceHeadphonesCount: snapshot.deviceHeadphonesCount,
						deviceSpeakersCount: snapshot.deviceSpeakersCount,
						tierBudgetCount: snapshot.tierBudgetCount,
						tierMidCount: snapshot.tierMidCount,
						tierPremiumCount: snapshot.tierPremiumCount,
						tierFlagshipCount: snapshot.tierFlagshipCount,
						comparisonSameGaplessCount: snapshot.comparisonSameGaplessCount ?? 0,
						comparisonSameGapCount: snapshot.comparisonSameGapCount ?? 0,
						comparisonDifferentGaplessCount: snapshot.comparisonDifferentGaplessCount ?? 0,
						comparisonDifferentGapCount: snapshot.comparisonDifferentGapCount ?? 0,
						codecMatchupMatrix: snapshot.codecMatchupMatrix as Record<
							string,
							Record<string, { a_wins: number; b_wins: number; neither: number }>
						> | null,
						codecEquivalenceRatios: snapshot.codecEquivalenceRatios as Record<
							string,
							number
						> | null,
						flacVsLossyWinRates: snapshot.flacVsLossyWinRates as Record<
							string,
							Record<string, number>
						> | null,
						codecPqScores: snapshot.codecPqScores as Record<string, number> | null,
						codecPqScoresByGenre: snapshot.codecPqScoresByGenre as Record<
							string,
							Record<string, number>
						> | null,
						insights: snapshot.insights as Record<string, unknown> | null
					}
				: null
		};
	} catch {
		// Table may not exist yet (no migrations applied), or DB is empty
		return { snapshot: null, contentLibrary: null };
	}
};
