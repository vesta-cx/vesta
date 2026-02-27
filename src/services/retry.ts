/** @format */

const RETRYABLE_HTTP = new Set([423, 429, 500, 502, 503, 504]);

export const jitter = (valueMs: number): number => {
	const delta = Math.floor(valueMs * 0.2);
	const offset = Math.floor(Math.random() * (delta * 2 + 1)) - delta;
	return Math.max(50, valueMs + offset);
};

export const computeBackoffMs = (attempt: number, statusCode?: number): number => {
	if (statusCode === 429) {
		return jitter(Math.min(120_000, 5_000 * Math.max(1, attempt)));
	}
	const base = Math.min(60_000, 1_000 * 2 ** Math.max(0, attempt - 1));
	return jitter(base);
};

export const isRetryableHttpStatus = (status: number): boolean =>
	RETRYABLE_HTTP.has(status);

export const isStorageAuthStatus = (status: number): boolean =>
	status === 401 || status === 403;

export const sleep = async (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));
