/** @format */

import {
	getIdempotentResponse,
	hashRequest,
	saveIdempotentResponse,
} from "./inbox-repository.js";
import type { EnqueueResponse } from "../types/contracts.js";

export class IdempotencyConflictError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "IdempotencyConflictError";
	}
}

export const getExistingIdempotentResult = async (params: {
	scope: string;
	key: string;
	requestBody: unknown;
}): Promise<{ status: number; body: EnqueueResponse } | null> => {
	const existing = await getIdempotentResponse(params.scope, params.key);
	if (!existing) return null;
	const requestHash = await hashRequest(
		JSON.stringify(params.requestBody),
	);
	if (existing.requestHash !== requestHash) {
		throw new IdempotencyConflictError(
			"Idempotency key reuse with different payload is not allowed",
		);
	}
	return { status: existing.status, body: existing.body };
};

export const storeIdempotentResult = async (params: {
	scope: string;
	key: string;
	requestBody: unknown;
	status: number;
	body: EnqueueResponse;
}): Promise<void> => {
	const requestHash = await hashRequest(
		JSON.stringify(params.requestBody),
	);
	await saveIdempotentResponse({
		scope: params.scope,
		key: params.key,
		requestHash,
		status: params.status,
		body: params.body,
	});
};
