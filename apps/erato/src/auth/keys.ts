/** @format */

import type { ApiKeyMeta } from "./types";
import { parseApiKeyMeta } from "./types";
import { hashApiKey } from "./helpers";

const KV_PREFIX = "ak:";

export const generateApiKey = (): string => {
	const a = crypto.randomUUID().replace(/-/g, "");
	const b = crypto.randomUUID().replace(/-/g, "");
	return `vesta_${a}${b}`;
};

export const storeApiKey = async (
	kv: KVNamespace,
	rawKey: string,
	meta: Omit<ApiKeyMeta, "createdAt">,
): Promise<void> => {
	const hash = await hashApiKey(rawKey);
	const fullMeta: ApiKeyMeta = {
		...meta,
		createdAt: new Date().toISOString(),
	};

	const options: KVNamespacePutOptions = {};
	if (meta.expiresAt) {
		const ttlMs = new Date(meta.expiresAt).getTime() - Date.now();
		if (ttlMs > 0) {
			options.expirationTtl = Math.ceil(ttlMs / 1000);
		}
	}

	await kv.put(`${KV_PREFIX}${hash}`, JSON.stringify(fullMeta), options);
};

export const revokeApiKey = async (
	kv: KVNamespace,
	rawKey: string,
): Promise<void> => {
	const hash = await hashApiKey(rawKey);
	await kv.delete(`${KV_PREFIX}${hash}`);
};

export const getApiKeyMeta = async (
	kv: KVNamespace,
	rawKey: string,
): Promise<ApiKeyMeta | null> => {
	const hash = await hashApiKey(rawKey);
	const value = await kv.get(`${KV_PREFIX}${hash}`);
	if (!value) return null;
	return parseApiKeyMeta(value);
};
