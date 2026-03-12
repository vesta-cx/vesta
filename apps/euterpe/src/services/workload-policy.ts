/** @format */

import type {
	WorkloadKind,
	WorkloadMediaType,
	WorkloadToken,
} from "../types/contracts.js";

const VALID_MEDIA: WorkloadMediaType[] = [
	"audio",
	"image",
	"video",
	"document",
	"other",
];
const VALID_KINDS: WorkloadKind[] = [
	"transcode",
	"analyze",
	"thumbnail",
	"optimize",
	"validate",
	"other",
];

export const DEFAULT_WORKLOAD: WorkloadToken = "audio:transcode";

export const normalizeWorkloadToken = (
	value: string | undefined,
): WorkloadToken | null => {
	if (!value) return null;
	const normalized = value.trim().toLowerCase();
	const [media, kind, ...rest] = normalized.split(":");
	if (rest.length > 0 || !media || !kind) return null;
	if (!VALID_MEDIA.includes(media as WorkloadMediaType)) return null;
	if (!VALID_KINDS.includes(kind as WorkloadKind)) return null;
	return `${media}:${kind}` as WorkloadToken;
};

export const parseAllowedWorkloads = (
	raw: string | undefined,
): WorkloadToken[] => {
	if (!raw || raw.trim().length === 0) return [DEFAULT_WORKLOAD];
	const allowed = new Set<WorkloadToken>();
	for (const value of raw.split(",")) {
		const token = normalizeWorkloadToken(value);
		if (token) allowed.add(token);
	}
	return allowed.size > 0 ? Array.from(allowed) : [DEFAULT_WORKLOAD];
};
