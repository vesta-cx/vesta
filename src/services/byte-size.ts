/** @format */

const UNIT_MAP: Record<string, number> = {
	b: 1,
	k: 1_000,
	m: 1_000_000,
	g: 1_000_000_000,
	t: 1_000_000_000_000,
	kb: 1_000,
	mb: 1_000_000,
	gb: 1_000_000_000,
	tb: 1_000_000_000_000,
	kib: 1024,
	mib: 1024 ** 2,
	gib: 1024 ** 3,
	tib: 1024 ** 4,
	ki: 1024,
	mi: 1024 ** 2,
	gi: 1024 ** 3,
	ti: 1024 ** 4,
};

export const parseByteSize = (
	value: string | undefined,
	fallbackBytes: number,
): number => {
	if (!value || value.trim().length === 0) return fallbackBytes;
	const raw = value.trim().toLowerCase();

	// Accept plain bytes, e.g. "5368709120"
	if (/^\d+$/.test(raw)) {
		const parsed = Number(raw);
		return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallbackBytes;
	}

	// Accept human-readable units, e.g. "10m", "50g", "512KiB"
	const match = raw.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/i);
	if (!match) return fallbackBytes;

	const amount = Number(match[1]);
	const unit = match[2]!.toLowerCase();
	const multiplier = UNIT_MAP[unit];
	if (!Number.isFinite(amount) || amount <= 0 || !multiplier) return fallbackBytes;

	return Math.floor(amount * multiplier);
};
