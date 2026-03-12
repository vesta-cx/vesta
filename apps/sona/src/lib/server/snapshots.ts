import { eq, isNotNull, lt } from 'drizzle-orm';
import { parseList } from '../utils/list.js';
import type { Database } from './db';
import {
	answers,
	candidateFiles,
	listeningDevices,
	resultSnapshots,
	sourceFiles
} from './db/schema';
import { computeBradleyTerry } from './bradley-terry';

export const generateSnapshot = async (db: Database): Promise<void> => {
	// Get all answers
	const allAnswers = await db.select().from(answers).all();

	if (allAnswers.length === 0) {
		await db.insert(resultSnapshots).values({
			expiresAt: new Date(Date.now() + 30 * 60 * 1000),
			totalResponses: 0,
			insights: {}
		});
		return;
	}

	// Derive comparison type from pairingType + transitionMode
	const getComparisonType = (
		pairing: string,
		transition: string
	): 'same_gapless' | 'same_gap' | 'different_gapless' | 'different_gap' | null => {
		if (pairing === 'placebo') return null;
		const isSame = pairing === 'same_song';
		const isGapless = transition === 'gapless';
		if (isSame && isGapless) return 'same_gapless';
		if (isSame && !isGapless) return 'same_gap';
		if (!isSame && isGapless) return 'different_gapless';
		if (!isSame && !isGapless) return 'different_gap';
		return null;
	};

	// Build comparisons for Bradley-Terry
	const comparisons: Array<{ winner: string; loser: string }> = [];
	const codecWins: Record<string, number> = {};
	const codecTotal: Record<string, number> = {};

	// We need candidate details to know codec+bitrate
	const candidateCache = new Map<
		string,
		{ codec: string; bitrate: number; sourceFileId: string }
	>();

	const loadCandidate = async (id: string) => {
		if (candidateCache.has(id)) return candidateCache.get(id)!;
		const c = await db
			.select({
				codec: candidateFiles.codec,
				bitrate: candidateFiles.bitrate,
				sourceFileId: candidateFiles.sourceFileId
			})
			.from(candidateFiles)
			.where(eq(candidateFiles.id, id))
			.get();
		if (c) candidateCache.set(id, c);
		return c;
	};

	const sourceMetaCache = new Map<
		string,
		{ artist: string | null; title: string; genre: string | null }
	>();
	const loadSourceMeta = async (sourceFileId: string) => {
		if (sourceMetaCache.has(sourceFileId)) return sourceMetaCache.get(sourceFileId)!;
		const row = await db
			.select({
				artist: sourceFiles.artist,
				title: sourceFiles.title,
				genre: sourceFiles.genre
			})
			.from(sourceFiles)
			.where(eq(sourceFiles.id, sourceFileId))
			.get();
		const meta = {
			artist: row?.artist ?? null,
			title: row?.title ?? 'Unknown',
			genre: row?.genre ?? null
		};
		sourceMetaCache.set(sourceFileId, meta);
		return meta;
	};

	const sourceGenreCache = new Map<string, string[]>();
	const loadSourceGenres = async (sourceFileId: string): Promise<string[]> => {
		if (sourceGenreCache.has(sourceFileId)) return sourceGenreCache.get(sourceFileId)!;
		const row = await db
			.select({ genre: sourceFiles.genre })
			.from(sourceFiles)
			.where(eq(sourceFiles.id, sourceFileId))
			.get();
		const genres = parseList(row?.genre ?? '')
			.map((g) => g.toLowerCase().trim())
			.filter(Boolean);
		sourceGenreCache.set(sourceFileId, genres);
		return genres;
	};

	let neitherCount = 0;

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;

		const keyA = `${candA.codec}_${candA.bitrate}`;
		const keyB = `${candB.codec}_${candB.bitrate}`;

		if (answer.selected === 'a') {
			comparisons.push({ winner: keyA, loser: keyB });
			codecWins[candA.codec] = (codecWins[candA.codec] ?? 0) + 1;
		} else if (answer.selected === 'b') {
			comparisons.push({ winner: keyB, loser: keyA });
			codecWins[candB.codec] = (codecWins[candB.codec] ?? 0) + 1;
		} else {
			neitherCount += 1;
		}

		codecTotal[candA.codec] = (codecTotal[candA.codec] ?? 0) + 1;
		codecTotal[candB.codec] = (codecTotal[candB.codec] ?? 0) + 1;
	}

	const neitherRate = allAnswers.length > 0 ? neitherCount / allAnswers.length : 0;

	// Codec win rates
	const codecWinRates: Record<string, number> = {};
	for (const [codec, total] of Object.entries(codecTotal)) {
		codecWinRates[codec] = total > 0 ? (codecWins[codec] ?? 0) / total : 0;
	}

	// Bradley-Terry scores
	const allItems = [...new Set(comparisons.flatMap((c) => [c.winner, c.loser]))];
	const bradleyTerryScores = computeBradleyTerry(comparisons, allItems);

	// Genre-segmented Bradley-Terry for codecPqScoresByGenre
	const codecPqScoresByGenre: Record<string, Record<string, number>> = {};
	const comparisonsByGenre = new Map<string, Array<{ winner: string; loser: string }>>();

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;

		const genresA = await loadSourceGenres(candA.sourceFileId);
		const genresB = await loadSourceGenres(candB.sourceFileId);
		const genres = new Set([...genresA, ...genresB]);

		const keyA = `${candA.codec}_${candA.bitrate}`;
		const keyB = `${candB.codec}_${candB.bitrate}`;
		let winner: string;
		let loser: string;
		if (answer.selected === 'a') {
			winner = keyA;
			loser = keyB;
		} else if (answer.selected === 'b') {
			winner = keyB;
			loser = keyA;
		} else continue;

		for (const g of genres) {
			if (!comparisonsByGenre.has(g)) comparisonsByGenre.set(g, []);
			comparisonsByGenre.get(g)!.push({ winner, loser });
		}
	}

	for (const [genre, genreComparisons] of comparisonsByGenre) {
		const genreItems = [...new Set(genreComparisons.flatMap((c) => [c.winner, c.loser]))];
		if (genreItems.length < 2) continue;
		const genreScores = computeBradleyTerry(genreComparisons, genreItems);
		const maxGenreStrength = Math.max(...Object.values(genreScores), 1);
		for (const [key, strength] of Object.entries(genreScores)) {
			codecPqScoresByGenre[key] = codecPqScoresByGenre[key] ?? {};
			codecPqScoresByGenre[key][genre] = Math.round((strength / maxGenreStrength) * 1000) / 10;
		}
	}

	// Device breakdown (deviceType + priceTier)
	const deviceBreakdown: Record<string, number> = {};
	const tierBreakdown: Record<string, number> = {};
	let totalResponseTime = 0;
	let responseTimeCount = 0;
	const comparisonCounts = {
		same_gapless: 0,
		same_gap: 0,
		different_gapless: 0,
		different_gap: 0
	};

	for (const answer of allAnswers) {
		const device = await db
			.select({
				deviceType: listeningDevices.deviceType,
				priceTier: listeningDevices.priceTier
			})
			.from(listeningDevices)
			.where(eq(listeningDevices.id, answer.deviceId))
			.get();
		if (device) {
			deviceBreakdown[device.deviceType] = (deviceBreakdown[device.deviceType] ?? 0) + 1;
			tierBreakdown[device.priceTier] = (tierBreakdown[device.priceTier] ?? 0) + 1;
		}
		if (answer.responseTime != null) {
			totalResponseTime += answer.responseTime;
			responseTimeCount += 1;
		}
		const compType = getComparisonType(answer.pairingType, answer.transitionMode);
		if (compType) comparisonCounts[compType] += 1;
	}

	const avgResponseTimeMs =
		responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : null;

	// Heatmap data: codec x bitrate win rates
	const heatmapWins: Record<string, Record<string, number>> = {};
	const heatmapTotal: Record<string, Record<string, number>> = {};

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;

		for (const cand of [candA, candB]) {
			heatmapTotal[cand.codec] = heatmapTotal[cand.codec] ?? {};
			heatmapTotal[cand.codec][String(cand.bitrate)] =
				(heatmapTotal[cand.codec][String(cand.bitrate)] ?? 0) + 1;
		}

		if (answer.selected === 'a') {
			heatmapWins[candA.codec] = heatmapWins[candA.codec] ?? {};
			heatmapWins[candA.codec][String(candA.bitrate)] =
				(heatmapWins[candA.codec][String(candA.bitrate)] ?? 0) + 1;
		} else if (answer.selected === 'b') {
			heatmapWins[candB.codec] = heatmapWins[candB.codec] ?? {};
			heatmapWins[candB.codec][String(candB.bitrate)] =
				(heatmapWins[candB.codec][String(candB.bitrate)] ?? 0) + 1;
		}
	}

	const heatmap: Array<{ row: string; col: string; value: number }> = [];
	for (const [codec, bitrateMap] of Object.entries(heatmapTotal)) {
		for (const [bitrate, total] of Object.entries(bitrateMap)) {
			const wins = heatmapWins[codec]?.[bitrate] ?? 0;
			heatmap.push({
				row: codec,
				col: bitrate === '0' ? 'lossless' : `${bitrate}`,
				value: total > 0 ? wins / total : 0
			});
		}
	}

	// FLAC vs lossy: for each lossy (codec, bitrate), win rate of FLAC when compared
	const flacVsLossyWins: Record<string, Record<string, number>> = {};
	const flacVsLossyTotal: Record<string, Record<string, number>> = {};

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;

		const isAFlac = candA.codec === 'flac';
		const isBFlac = candB.codec === 'flac';
		if (!isAFlac && !isBFlac) continue; // both lossy
		if (isAFlac && isBFlac) continue; // both flac

		const lossy = isAFlac ? candB : candA;
		if (lossy.codec === 'flac') continue;

		const brKey = String(lossy.bitrate);
		flacVsLossyTotal[lossy.codec] = flacVsLossyTotal[lossy.codec] ?? {};
		flacVsLossyTotal[lossy.codec][brKey] = (flacVsLossyTotal[lossy.codec][brKey] ?? 0) + 1;

		if (answer.selected === 'a' && isAFlac) {
			flacVsLossyWins[lossy.codec] = flacVsLossyWins[lossy.codec] ?? {};
			flacVsLossyWins[lossy.codec][brKey] = (flacVsLossyWins[lossy.codec][brKey] ?? 0) + 1;
		} else if (answer.selected === 'b' && isBFlac) {
			flacVsLossyWins[lossy.codec] = flacVsLossyWins[lossy.codec] ?? {};
			flacVsLossyWins[lossy.codec][brKey] = (flacVsLossyWins[lossy.codec][brKey] ?? 0) + 1;
		}
	}

	const flacVsLossy: Record<string, Record<string, number>> = {};
	for (const [codec, bitrateMap] of Object.entries(flacVsLossyTotal)) {
		flacVsLossy[codec] = {};
		for (const [br, total] of Object.entries(bitrateMap)) {
			const wins = flacVsLossyWins[codec]?.[br] ?? 0;
			flacVsLossy[codec][br] = total > 0 ? wins / total : 0;
		}
	}

	// Neither rate by bitrate difference
	const neitherByDiff: Record<string, { neither: number; total: number }> = {};
	const getDiffBucket = (diff: number): string => {
		if (diff <= 32) return '0-32';
		if (diff <= 64) return '32-64';
		if (diff <= 128) return '64-128';
		return '128+';
	};

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;

		const diff = Math.abs(candA.bitrate - candB.bitrate);
		const bucket = getDiffBucket(diff);
		neitherByDiff[bucket] = neitherByDiff[bucket] ?? { neither: 0, total: 0 };
		neitherByDiff[bucket].total += 1;
		if (answer.selected === 'neither') neitherByDiff[bucket].neither += 1;
	}

	const neitherByBitrateDiff: Record<string, number> = {};
	for (const [bucket, { neither, total }] of Object.entries(neitherByDiff)) {
		neitherByBitrateDiff[bucket] = total > 0 ? neither / total : 0;
	}

	// codec_matchup_matrix: { "opus_vs_mp3": { "64_128": { a_wins, b_wins, neither }, ... } }
	const codecMatchupMatrix: Record<
		string,
		Record<string, { a_wins: number; b_wins: number; neither: number }>
	> = {};

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;
		if (candA.codec === candB.codec) continue;

		const [first, second] = candA.codec < candB.codec ? [candA, candB] : [candB, candA];
		const pairKey = `${first.codec}_vs_${second.codec}`;
		const brKey = `${first.bitrate}_${second.bitrate}`;

		codecMatchupMatrix[pairKey] = codecMatchupMatrix[pairKey] ?? {};
		const cell = codecMatchupMatrix[pairKey][brKey] ?? {
			a_wins: 0,
			b_wins: 0,
			neither: 0
		};

		const firstWon =
			(answer.selected === 'a' && candA.codec === first.codec) ||
			(answer.selected === 'b' && candB.codec === first.codec);
		if (answer.selected === 'neither') {
			cell.neither += 1;
		} else if (firstWon) {
			cell.a_wins += 1;
		} else {
			cell.b_wins += 1;
		}
		codecMatchupMatrix[pairKey][brKey] = cell;
	}

	// bitrate_gap_confidence: { "0_32": { neither_rate, sample_size }, ... }
	const bucketToKey: Record<string, string> = {
		'0-32': '0_32',
		'32-64': '33_64',
		'64-128': '65_128',
		'128+': '129_plus'
	};
	const bitrateGapConfidence: Record<string, { neither_rate: number; sample_size: number }> = {};
	for (const [bucket, { neither, total }] of Object.entries(neitherByDiff)) {
		const key = bucketToKey[bucket] ?? bucket;
		bitrateGapConfidence[key] = {
			neither_rate: total > 0 ? neither / total : 0,
			sample_size: total
		};
	}

	// codec_equivalence_ratios: { "opus_vs_mp3": 1.42 } — derive from 50% crossover
	const codecEquivalenceRatios: Record<string, number> = {};
	for (const [pairKey, brMap] of Object.entries(codecMatchupMatrix)) {
		// Find bitrate pairs where win rate ≈ 50%
		let bestRatio: number | null = null;
		for (const [brKey, cell] of Object.entries(brMap)) {
			const total = cell.a_wins + cell.b_wins + cell.neither;
			if (total < 10) continue;
			const winRate = cell.a_wins / (cell.a_wins + cell.b_wins || 1);
			if (winRate >= 0.45 && winRate <= 0.55) {
				const [brA, brB] = brKey.split('_').map(Number);
				if (brA > 0 && brB > 0) {
					const ratio = brB / brA;
					if (bestRatio == null || Math.abs(ratio - 1) < Math.abs(bestRatio - 1)) bestRatio = ratio;
				}
			}
		}
		if (bestRatio != null) codecEquivalenceRatios[pairKey] = bestRatio;
	}

	// Bitrate tier win rates: lossless (0), high (256+), mid (128-192), low (<128)
	const getBitrateTier = (bitrate: number): 'lossless' | 'high' | 'mid' | 'low' => {
		if (bitrate === 0) return 'lossless';
		if (bitrate >= 256) return 'high';
		if (bitrate >= 128) return 'mid';
		return 'low';
	};
	const tierWins: Record<string, number> = { lossless: 0, high: 0, mid: 0, low: 0 };
	const tierTotal: Record<string, number> = { lossless: 0, high: 0, mid: 0, low: 0 };

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;
		for (const cand of [candA, candB]) {
			const tier = getBitrateTier(cand.bitrate);
			tierTotal[tier] += 1;
			if (
				(answer.selected === 'a' && cand === candA) ||
				(answer.selected === 'b' && cand === candB)
			) {
				tierWins[tier] += 1;
			}
		}
	}

	const bitrateLosslessWinRate =
		tierTotal.lossless > 0 ? tierWins.lossless / tierTotal.lossless : null;
	const bitrateHighWinRate = tierTotal.high > 0 ? tierWins.high / tierTotal.high : null;
	const bitrateMidWinRate = tierTotal.mid > 0 ? tierWins.mid / tierTotal.mid : null;
	const bitrateLowWinRate = tierTotal.low > 0 ? tierWins.low / tierTotal.low : null;

	// Headline matchups: lossless vs lossy, opus vs mp3, aac vs mp3
	let losslessVsLossyWins = 0;
	let losslessVsLossyTotal = 0;
	let opusVsMp3OpusWins = 0;
	let opusVsMp3Total = 0;
	let aacVsMp3AacWins = 0;
	let aacVsMp3Total = 0;

	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;

		const isAFlac = candA.codec === 'flac';
		const isBFlac = candB.codec === 'flac';
		if (isAFlac !== isBFlac) {
			losslessVsLossyTotal += 1;
			if ((answer.selected === 'a' && isAFlac) || (answer.selected === 'b' && isBFlac)) {
				losslessVsLossyWins += 1;
			}
		}

		const opusMp3 =
			(candA.codec === 'opus' && candB.codec === 'mp3') ||
			(candA.codec === 'mp3' && candB.codec === 'opus');
		if (opusMp3 && candA.bitrate === candB.bitrate) {
			opusVsMp3Total += 1;
			if (
				(answer.selected === 'a' && candA.codec === 'opus') ||
				(answer.selected === 'b' && candB.codec === 'opus')
			) {
				opusVsMp3OpusWins += 1;
			}
		}

		const aacMp3 =
			(candA.codec === 'aac' && candB.codec === 'mp3') ||
			(candA.codec === 'mp3' && candB.codec === 'aac');
		if (aacMp3 && candA.bitrate === candB.bitrate) {
			aacVsMp3Total += 1;
			if (
				(answer.selected === 'a' && candA.codec === 'aac') ||
				(answer.selected === 'b' && candB.codec === 'aac')
			) {
				aacVsMp3AacWins += 1;
			}
		}
	}

	// PQ scores: normalize Bradley-Terry to 0-100 (max = 100%)
	const maxStrength = Math.max(...Object.values(bradleyTerryScores), 1);
	const codecPqScores: Record<string, number> = {};
	for (const [key, strength] of Object.entries(bradleyTerryScores)) {
		codecPqScores[key] = Math.round((strength / maxStrength) * 1000) / 10;
	}

	// transparency_thresholds: bitrate where PQ > 95% per codec (excluding flac)
	const transparencyThresholds: Record<string, number> = {};
	const pqByCodec: Record<string, Array<{ bitrate: number; pq: number }>> = {};
	for (const [key, pq] of Object.entries(codecPqScores)) {
		const [codec, brStr] = key.split('_');
		const bitrate = parseInt(brStr ?? '0', 10);
		pqByCodec[codec] = pqByCodec[codec] ?? [];
		pqByCodec[codec].push({ bitrate, pq });
	}
	for (const [codec, points] of Object.entries(pqByCodec)) {
		if (codec === 'flac') continue;
		const sorted = points.sort((a, b) => a.bitrate - b.bitrate);
		for (const { bitrate, pq } of sorted) {
			if (pq >= 95) {
				transparencyThresholds[codec] = bitrate;
				break;
			}
		}
	}

	// diminishing_returns_points: bitrate where ΔPQ per 32kbps < 2%
	const diminishingReturnsPoints: Record<string, number> = {};
	const SLOPE_THRESHOLD = 2 / 32; // ΔPQ < 2% per 32kbps → slope < 2/32 per kbps
	for (const [codec, points] of Object.entries(pqByCodec)) {
		if (codec === 'flac') continue;
		const sorted = points.filter((p) => p.bitrate > 0).sort((a, b) => a.bitrate - b.bitrate);
		let lastBr = 0;
		let lastPq = 0;
		for (const { bitrate, pq } of sorted) {
			const deltaBr = bitrate - lastBr;
			if (deltaBr >= 32 && lastBr > 0) {
				const slope = (pq - lastPq) / deltaBr;
				if (slope < SLOPE_THRESHOLD) {
					diminishingReturnsPoints[codec] = bitrate;
					break;
				}
			}
			lastBr = bitrate;
			lastPq = pq;
		}
	}

	// Quality vs content preference (different-song only). Do NOT enable on homepage yet.
	const differentSongAnswers = allAnswers.filter((a) => a.pairingType === 'different_song');
	let qualityWins = 0;
	let contentWins = 0;
	const qualityByGap: Record<string, { quality_wins: number; content_wins: number }> = {};
	const getGapKey = (diff: number): string => {
		if (diff <= 32) return '32kbps_gap';
		if (diff <= 64) return '64kbps_gap';
		if (diff <= 128) return '128kbps_gap';
		return '192kbps_gap';
	};

	for (const answer of differentSongAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;
		if (answer.selected === 'neither') continue;

		const keyA = `${candA.codec}_${candA.bitrate}`;
		const keyB = `${candB.codec}_${candB.bitrate}`;
		const pqA = codecPqScores[keyA] ?? 0;
		const pqB = codecPqScores[keyB] ?? 0;
		const higherQualityPicked =
			(answer.selected === 'a' && pqA >= pqB) || (answer.selected === 'b' && pqB >= pqA);

		if (higherQualityPicked) qualityWins += 1;
		else contentWins += 1;

		const diff = Math.abs(candA.bitrate - candB.bitrate);
		const gapKey = getGapKey(diff);
		qualityByGap[gapKey] = qualityByGap[gapKey] ?? {
			quality_wins: 0,
			content_wins: 0
		};
		if (higherQualityPicked) qualityByGap[gapKey].quality_wins += 1;
		else qualityByGap[gapKey].content_wins += 1;
	}

	const crossGenreQualityTradeoff =
		differentSongAnswers.length > 0
			? { quality_wins: qualityWins, content_wins: contentWins }
			: null;
	const qualityVsContentByGap = Object.keys(qualityByGap).length > 0 ? qualityByGap : null;

	// New snapshot stats (pair-picking redesign)
	const sourceIdsUsed = new Set<string>();
	const uniquePairings = new Set<string>();
	for (const answer of allAnswers) {
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;
		sourceIdsUsed.add(candA.sourceFileId);
		sourceIdsUsed.add(candB.sourceFileId);
		const pairKey =
			answer.candidateAId < answer.candidateBId
				? `${answer.candidateAId}:${answer.candidateBId}`
				: `${answer.candidateBId}:${answer.candidateAId}`;
		uniquePairings.add(pairKey);
	}

	const approvedSources = await db
		.select({ id: sourceFiles.id, artist: sourceFiles.artist, title: sourceFiles.title })
		.from(sourceFiles)
		.where(isNotNull(sourceFiles.approvedAt))
		.all();

	const sourcesetSongCount = approvedSources.length;
	const artistSet = new Set<string>();
	for (const s of approvedSources) {
		if (s.artist) {
			parseList(s.artist).forEach((a) => artistSet.add(a.trim()));
		}
	}
	const sourcesetArtistCount = artistSet.size;
	const sourceCoverage =
		approvedSources.length > 0 ? sourceIdsUsed.size / approvedSources.length : null;

	const roundsPerMode: Record<string, number> = {};
	const winCountByMode: Record<string, number> = {};
	const neitherCountByMode: Record<string, number> = {};
	const responseTimeSumByMode: Record<string, number> = {};
	const responseTimeCountByMode: Record<string, number> = {};

	for (const answer of allAnswers) {
		const mode = (answer as { roundMode?: string }).roundMode ?? 'mixtape';
		roundsPerMode[mode] = (roundsPerMode[mode] ?? 0) + 1;
		if (answer.selected === 'neither') {
			neitherCountByMode[mode] = (neitherCountByMode[mode] ?? 0) + 1;
		} else {
			winCountByMode[mode] = (winCountByMode[mode] ?? 0) + 1;
		}
		if (typeof answer.responseTime === 'number' && answer.responseTime >= 0) {
			responseTimeSumByMode[mode] = (responseTimeSumByMode[mode] ?? 0) + answer.responseTime;
			responseTimeCountByMode[mode] = (responseTimeCountByMode[mode] ?? 0) + 1;
		}
	}

	const winRateByMode: Record<string, number> = {};
	const neitherRateByMode: Record<string, number> = {};
	const avgResponseTimeByMode: Record<string, number> = {};
	for (const mode of Object.keys(roundsPerMode)) {
		const total = roundsPerMode[mode];
		winRateByMode[mode] = total > 0 ? (winCountByMode[mode] ?? 0) / total : 0;
		neitherRateByMode[mode] = total > 0 ? (neitherCountByMode[mode] ?? 0) / total : 0;
		const rtSum = responseTimeSumByMode[mode];
		const rtCount = responseTimeCountByMode[mode];
		if (rtCount != null && rtCount > 0 && rtSum != null) {
			avgResponseTimeByMode[mode] = rtSum / rtCount;
		}
	}

	const genreScores: Record<string, number> = {};
	for (const [key, genreMap] of Object.entries(codecPqScoresByGenre)) {
		for (const [genre, score] of Object.entries(genreMap)) {
			genreScores[genre] = (genreScores[genre] ?? 0) + score;
		}
	}
	const topGenres = Object.entries(genreScores)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(([genre, score]) => ({ genre, score }));

	const codecScores: Record<string, number> = {};
	for (const [key, score] of Object.entries(codecPqScores)) {
		const codec = key.split('_')[0];
		if (codec) {
			codecScores[codec] = Math.max(codecScores[codec] ?? 0, score);
		}
	}
	const topCodecs = Object.entries(codecScores)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(([codec, score]) => ({ codec, score }));

	const sourceWins: Record<string, number> = {};
	const artistWins: Record<string, number> = {};
	for (const answer of allAnswers) {
		if (answer.selected === 'neither') continue;
		const candA = await loadCandidate(answer.candidateAId);
		const candB = await loadCandidate(answer.candidateBId);
		if (!candA || !candB) continue;
		const winnerSourceId = answer.selected === 'a' ? candA.sourceFileId : candB.sourceFileId;
		sourceWins[winnerSourceId] = (sourceWins[winnerSourceId] ?? 0) + 1;
		const meta = await loadSourceMeta(winnerSourceId);
		if (meta.artist) {
			for (const a of parseList(meta.artist)
				.map((x) => x.trim())
				.filter(Boolean)) {
				artistWins[a] = (artistWins[a] ?? 0) + 1;
			}
		}
	}
	const topArtists = Object.entries(artistWins)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(([artist, score]) => ({ artist, score }));

	const topSongs = Object.entries(sourceWins)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 5)
		.map(async ([sourceId, score]) => {
			const meta = await loadSourceMeta(sourceId);
			return { sourceId, title: meta.title, score };
		});
	const topSongsRes = (await Promise.all(topSongs)).filter((s) => s.title);

	const insights = {
		codecWinRates,
		bradleyTerryScores,
		deviceBreakdown,
		heatmap,
		neitherRate,
		flacVsLossy,
		neitherByBitrateDiff
	};

	// Insert snapshot with all scalar columns
	await db.insert(resultSnapshots).values({
		expiresAt: new Date(Date.now() + 30 * 60 * 1000),
		totalResponses: allAnswers.length,
		totalSessions: null, // requires session_id on answers
		neitherRate,
		avgResponseTimeMs,
		flacWinRate: codecWinRates['flac'] ?? null,
		flacComparisons: codecTotal['flac'] ?? null,
		opusWinRate: codecWinRates['opus'] ?? null,
		opusComparisons: codecTotal['opus'] ?? null,
		aacWinRate: codecWinRates['aac'] ?? null,
		aacComparisons: codecTotal['aac'] ?? null,
		mp3WinRate: codecWinRates['mp3'] ?? null,
		mp3Comparisons: codecTotal['mp3'] ?? null,
		bitrateLosslessWinRate,
		bitrateHighWinRate,
		bitrateMidWinRate,
		bitrateLowWinRate,
		losslessVsLossyLosslessWins: losslessVsLossyTotal > 0 ? losslessVsLossyWins : null,
		losslessVsLossyTotal: losslessVsLossyTotal > 0 ? losslessVsLossyTotal : null,
		opusVsMp3OpusWins: opusVsMp3Total > 0 ? opusVsMp3OpusWins : null,
		opusVsMp3Total: opusVsMp3Total > 0 ? opusVsMp3Total : null,
		aacVsMp3AacWins: aacVsMp3Total > 0 ? aacVsMp3AacWins : null,
		aacVsMp3Total: aacVsMp3Total > 0 ? aacVsMp3Total : null,
		deviceHeadphonesCount: deviceBreakdown['headphones'] ?? null,
		deviceSpeakersCount: deviceBreakdown['speaker'] ?? null,
		tierBudgetCount: tierBreakdown['budget'] ?? null,
		tierMidCount: tierBreakdown['mid'] ?? null,
		tierPremiumCount: tierBreakdown['premium'] ?? null,
		tierFlagshipCount: tierBreakdown['flagship'] ?? null,
		comparisonSameGaplessCount: comparisonCounts.same_gapless,
		comparisonSameGapCount: comparisonCounts.same_gap,
		comparisonDifferentGaplessCount: comparisonCounts.different_gapless,
		comparisonDifferentGapCount: comparisonCounts.different_gap,
		codecMatchupMatrix: Object.keys(codecMatchupMatrix).length > 0 ? codecMatchupMatrix : null,
		bitrateGapConfidence:
			Object.keys(bitrateGapConfidence).length > 0 ? bitrateGapConfidence : null,
		codecEquivalenceRatios:
			Object.keys(codecEquivalenceRatios).length > 0 ? codecEquivalenceRatios : null,
		flacVsLossyWinRates: Object.keys(flacVsLossy).length > 0 ? flacVsLossy : null,
		codecPqScores: Object.keys(codecPqScores).length > 0 ? codecPqScores : null,
		transparencyThresholds:
			Object.keys(transparencyThresholds).length > 0 ? transparencyThresholds : null,
		diminishingReturnsPoints:
			Object.keys(diminishingReturnsPoints).length > 0 ? diminishingReturnsPoints : null,
		codecPqScoresByGenre:
			Object.keys(codecPqScoresByGenre).length > 0 ? codecPqScoresByGenre : null,
		crossGenreQualityTradeoff,
		qualityVsContentByGap,
		sourcesetSongCount,
		sourcesetArtistCount,
		sourceCoverage,
		uniquePairingCount: uniquePairings.size,
		roundsPerMode: Object.keys(roundsPerMode).length > 0 ? roundsPerMode : null,
		winRateByMode: Object.keys(winRateByMode).length > 0 ? winRateByMode : null,
		neitherRateByMode: Object.keys(neitherRateByMode).length > 0 ? neitherRateByMode : null,
		avgResponseTimeByMode:
			Object.keys(avgResponseTimeByMode).length > 0 ? avgResponseTimeByMode : null,
		topGenres: topGenres.length > 0 ? topGenres : null,
		topArtists: topArtists.length > 0 ? topArtists : null,
		topSongs: topSongsRes.length > 0 ? topSongsRes : null,
		topCodecs: topCodecs.length > 0 ? topCodecs : null,
		insights
	});

	// Clean up old expired snapshots (keep last 100)
	const oldSnapshots = await db
		.select({ createdAt: resultSnapshots.createdAt })
		.from(resultSnapshots)
		.where(lt(resultSnapshots.expiresAt, new Date()))
		.all();

	if (oldSnapshots.length > 100) {
		const toDelete = oldSnapshots.slice(100);
		for (const s of toDelete) {
			if (s.createdAt) {
				await db.delete(resultSnapshots).where(eq(resultSnapshots.createdAt, s.createdAt));
			}
		}
	}
};
