import { relations } from 'drizzle-orm';
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ── Enums (stored as text in SQLite) ──────────────────────────────────────────

export const DEVICE_TYPES = ['speaker', 'headphones'] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const CONNECTION_TYPES = ['wired', 'bluetooth', 'wifi', 'ir'] as const;
export type ConnectionType = (typeof CONNECTION_TYPES)[number];

export const PRICE_TIERS = ['budget', 'mid', 'premium', 'flagship'] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

export const CODECS = ['flac', 'opus', 'mp3', 'aac'] as const;
export type Codec = (typeof CODECS)[number];

export const SELECTED_OPTIONS = ['a', 'b', 'neither'] as const;
export type SelectedOption = (typeof SELECTED_OPTIONS)[number];

export const PAIRING_TYPES = ['same_song', 'different_song', 'placebo'] as const;
export type PairingType = (typeof PAIRING_TYPES)[number];

/** Canonical genres for PQ-by-genre analysis. Prefer these when tagging sources. */
export const GENRES = [
	'classical',
	'electronic',
	'jazz',
	'hip-hop',
	'rock',
	'pop',
	'ambient',
	'folk',
	'other'
] as const;
export type Genre = (typeof GENRES)[number];

export const TRANSITION_MODES = [
	'gapless',
	'gap_continue',
	'gap_restart',
	'gap_pause_resume'
] as const;
export type TransitionMode = (typeof TRANSITION_MODES)[number];

// ── Tables ────────────────────────────────────────────────────────────────────

export const listeningDevices = sqliteTable('listening_devices', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	modifiedAt: integer('modified_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	approvedAt: integer('approved_at', { mode: 'timestamp' }),
	approvedBy: text('approved_by'),
	deviceType: text('device_type', { enum: DEVICE_TYPES }).notNull(),
	connectionType: text('connection_type', { enum: CONNECTION_TYPES }).notNull(),
	brand: text('brand').notNull(),
	model: text('model').notNull(),
	priceTier: text('price_tier', { enum: PRICE_TIERS }).notNull()
});

export const sourceFiles = sqliteTable('source_files', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	/** Basename from filename (e.g. "song_name" from "song_name_flac_0.flac"). Used for merge-on-upload. */
	basename: text('basename'),
	/** Null while Euterpe is transcoding; set when webhook fires. */
	r2Key: text('r2_key'),
	uploadedAt: integer('uploaded_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	licenseUrl: text('license_url').notNull(),
	approvedAt: integer('approved_at', { mode: 'timestamp' }),
	approvedBy: text('approved_by'),
	title: text('title').notNull(),
	streamUrl: text('stream_url'),
	/** Semicolon-separated main artists (e.g. "Artist A; Artist B"). Use \; for semicolons in names. */
	artist: text('artist'),
	/** Semicolon-separated featured artists. Displayed as "(feat. artist1, artist2 & artist3)". */
	featuredArtists: text('featured_artists'),
	/** Semicolon-separated remix artists. Displayed as "(artist1, artist2 & artist3 Remix)". */
	remixArtists: text('remix_artists'),
	artistUrl: text('artist_url'),
	/** Semicolon-separated genres. Use \; for semicolons. Prefer values from GENRES for segment analysis. */
	genre: text('genre'),
	/** Null while Euterpe is transcoding; set when webhook fires. Total duration in ms. */
	duration: integer('duration')
});

export const qualityOptions = sqliteTable(
	'quality_options',
	{
		codec: text('codec', { enum: CODECS }).notNull(),
		bitrate: integer('bitrate').notNull(), // kbps, 0 for flac/lossless
		enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true)
	},
	(table) => [primaryKey({ columns: [table.codec, table.bitrate] })]
);

export const candidateFiles = sqliteTable('candidate_files', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	r2Key: text('r2_key').notNull(),
	codec: text('codec', { enum: CODECS }).notNull(),
	bitrate: integer('bitrate').notNull(),
	sourceFileId: text('source_file_id')
		.notNull()
		.references(() => sourceFiles.id)
});

export const ephemeralStreamUrls = sqliteTable('ephemeral_stream_urls', {
	token: text('token')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	candidateFileId: text('candidate_file_id')
		.notNull()
		.references(() => candidateFiles.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export const answers = sqliteTable('answers', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	/** Anonymous session UUID. Enables "my data vs global" comparisons. Portable: can be mapped to user_id via user_sessions when auth is added. */
	sessionId: text('session_id'),
	deviceId: text('device_id')
		.notNull()
		.references(() => listeningDevices.id),
	candidateAId: text('candidate_a_id')
		.notNull()
		.references(() => candidateFiles.id),
	candidateBId: text('candidate_b_id')
		.notNull()
		.references(() => candidateFiles.id),
	selected: text('selected', { enum: SELECTED_OPTIONS }).notNull(),
	pairingType: text('pairing_type', { enum: PAIRING_TYPES }).notNull(),
	transitionMode: text('transition_mode', { enum: TRANSITION_MODES }).notNull(),
	startTime: integer('start_time').notNull(), // segment start in ms
	segmentDuration: integer('segment_duration').notNull(), // segment length in ms
	responseTime: integer('response_time'), // time spent deciding in ms
	roundMode: text('round_mode') // codec_compare, bitrate_battle, genre_trials, tradeoff, mixtape
});

export const surveyConfig = sqliteTable('survey_config', {
	key: text('key').primaryKey(),
	value: text('value').notNull()
});

/** Easter egg messages shown in round summary at randomized intervals. Stored in DB to keep them out of source. */
export const easterEggMessages = sqliteTable('easter_egg_messages', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	message: text('message').notNull(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const resultSnapshots = sqliteTable('result_snapshots', {
	createdAt: integer('created_at', { mode: 'timestamp' })
		.primaryKey()
		.$defaultFn(() => new Date()),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	// Overall
	totalResponses: integer('total_responses').notNull(),
	totalSessions: integer('total_sessions'),
	neitherRate: real('neither_rate'),
	avgResponseTimeMs: integer('avg_response_time_ms'),
	// Codec win rates
	flacWinRate: real('flac_win_rate'),
	flacComparisons: integer('flac_comparisons'),
	opusWinRate: real('opus_win_rate'),
	opusComparisons: integer('opus_comparisons'),
	aacWinRate: real('aac_win_rate'),
	aacComparisons: integer('aac_comparisons'),
	mp3WinRate: real('mp3_win_rate'),
	mp3Comparisons: integer('mp3_comparisons'),
	// Bitrate tier win rates
	bitrateLosslessWinRate: real('bitrate_lossless_win_rate'),
	bitrateHighWinRate: real('bitrate_high_win_rate'),
	bitrateMidWinRate: real('bitrate_mid_win_rate'),
	bitrateLowWinRate: real('bitrate_low_win_rate'),
	// Headline matchups
	losslessVsLossyLosslessWins: integer('lossless_vs_lossy_lossless_wins'),
	losslessVsLossyTotal: integer('lossless_vs_lossy_total'),
	opusVsMp3OpusWins: integer('opus_vs_mp3_opus_wins'),
	opusVsMp3Total: integer('opus_vs_mp3_total'),
	aacVsMp3AacWins: integer('aac_vs_mp3_aac_wins'),
	aacVsMp3Total: integer('aac_vs_mp3_total'),
	// Device breakdown
	deviceHeadphonesCount: integer('device_headphones_count'),
	deviceSpeakersCount: integer('device_speakers_count'),
	tierBudgetCount: integer('tier_budget_count'),
	tierMidCount: integer('tier_mid_count'),
	tierPremiumCount: integer('tier_premium_count'),
	tierFlagshipCount: integer('tier_flagship_count'),
	// Comparison type distribution
	comparisonSameGaplessCount: integer('comparison_same_gapless_count'),
	comparisonSameGapCount: integer('comparison_same_gap_count'),
	comparisonDifferentGaplessCount: integer('comparison_different_gapless_count'),
	comparisonDifferentGapCount: integer('comparison_different_gap_count'),
	// Complex matrices (JSON)
	codecMatchupMatrix: text('codec_matchup_matrix', { mode: 'json' }).$type<
		Record<string, Record<string, { a_wins: number; b_wins: number; neither: number }>>
	>(),
	bitrateGapConfidence: text('bitrate_gap_confidence', { mode: 'json' }).$type<
		Record<string, { neither_rate: number; sample_size: number }>
	>(),
	codecEquivalenceRatios: text('codec_equivalence_ratios', { mode: 'json' }).$type<
		Record<string, number>
	>(),
	// FLAC vs lossy: FLAC win rate by codec and bitrate
	flacVsLossyWinRates: text('flac_vs_lossy_win_rates', { mode: 'json' }).$type<
		Record<string, Record<string, number>>
	>(),
	// PQ (Perceptual Quality) scores from Bradley-Terry
	codecPqScores: text('codec_pq_scores', { mode: 'json' }).$type<Record<string, number>>(),
	transparencyThresholds: text('transparency_thresholds', { mode: 'json' }).$type<
		Record<string, number>
	>(), // bitrate where PQ > 95% per codec
	diminishingReturnsPoints: text('diminishing_returns_points', { mode: 'json' }).$type<
		Record<string, number>
	>(), // bitrate where slope drops per codec
	/** PQ scores per codec+bitrate, segmented by genre. { "opus_128": { "classical": 82, "electronic": 91, ... } } */
	codecPqScoresByGenre: text('codec_pq_scores_by_genre', { mode: 'json' }).$type<
		Record<string, Record<string, number>>
	>(),
	/** Quality vs content preference (different-song comparisons). Do NOT enable on homepage until genre metadata is richer. */
	crossGenreQualityTradeoff: text('cross_genre_quality_tradeoff', { mode: 'json' }).$type<{
		quality_wins: number;
		content_wins: number;
		quality_threshold?: number;
	} | null>(),
	qualityVsContentByGap: text('quality_vs_content_by_gap', { mode: 'json' }).$type<Record<
		string,
		{ quality_wins: number; content_wins: number }
	> | null>(),
	// Snapshot expansion (pair-picking redesign)
	sourcesetSongCount: integer('sourceset_song_count'),
	sourcesetArtistCount: integer('sourceset_artist_count'),
	sourceCoverage: real('source_coverage'), // % of sources used in at least one round
	uniquePairingCount: integer('unique_pairing_count'),
	roundsPerMode: text('rounds_per_mode', { mode: 'json' }).$type<Record<string, number>>(),
	winRateByMode: text('win_rate_by_mode', { mode: 'json' }).$type<Record<string, number>>(),
	neitherRateByMode: text('neither_rate_by_mode', { mode: 'json' }).$type<Record<string, number>>(),
	avgResponseTimeByMode: text('avg_response_time_by_mode', { mode: 'json' }).$type<
		Record<string, number>
	>(),
	topGenres: text('top_genres', { mode: 'json' }).$type<Array<{ genre: string; score: number }>>(),
	topArtists: text('top_artists', { mode: 'json' }).$type<
		Array<{ artist: string; score: number }>
	>(),
	topSongs: text('top_songs', { mode: 'json' }).$type<
		Array<{ sourceId: string; title: string; score: number }>
	>(),
	topCodecs: text('top_codecs', { mode: 'json' }).$type<Array<{ codec: string; score: number }>>(),
	insights: text('insights', { mode: 'json' }).$type<Record<string, unknown>>()
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const sourceFilesRelations = relations(sourceFiles, ({ many }) => ({
	candidates: many(candidateFiles)
}));

export const candidateFilesRelations = relations(candidateFiles, ({ one, many }) => ({
	sourceFile: one(sourceFiles, {
		fields: [candidateFiles.sourceFileId],
		references: [sourceFiles.id]
	}),
	qualityOption: one(qualityOptions, {
		fields: [candidateFiles.codec, candidateFiles.bitrate],
		references: [qualityOptions.codec, qualityOptions.bitrate]
	}),
	ephemeralUrls: many(ephemeralStreamUrls)
}));

export const ephemeralStreamUrlsRelations = relations(ephemeralStreamUrls, ({ one }) => ({
	candidateFile: one(candidateFiles, {
		fields: [ephemeralStreamUrls.candidateFileId],
		references: [candidateFiles.id]
	})
}));

export const answersRelations = relations(answers, ({ one }) => ({
	device: one(listeningDevices, {
		fields: [answers.deviceId],
		references: [listeningDevices.id]
	}),
	candidateA: one(candidateFiles, {
		fields: [answers.candidateAId],
		references: [candidateFiles.id],
		relationName: 'candidateA'
	}),
	candidateB: one(candidateFiles, {
		fields: [answers.candidateBId],
		references: [candidateFiles.id],
		relationName: 'candidateB'
	})
}));

export const listeningDevicesRelations = relations(listeningDevices, ({ many }) => ({
	answers: many(answers)
}));

export const qualityOptionsRelations = relations(qualityOptions, ({ many }) => ({
	candidates: many(candidateFiles)
}));
