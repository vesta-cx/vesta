/** @format */

import { buildSignedWebhookHeaders } from "./webhook-signing.js";
import { isRetryableHttpStatus } from "./retry.js";

export interface RefreshCredentialsResponse {
	storage: {
		creds: {
			accessKeyId: string;
			secretAccessKey: string;
		};
	};
}

export const requestCredentialRefresh = async (params: {
	jobId: string;
	requesterId: string;
	refreshUrl: string;
	credentialVersion: number;
}): Promise<RefreshCredentialsResponse | null> => {
	const body = JSON.stringify({
		jobId: params.jobId,
		credentialVersion: params.credentialVersion,
	});
	const headers = await buildSignedWebhookHeaders({
		requesterId: params.requesterId,
		rawBody: body,
		eventId: params.jobId,
	});
	const response = await fetch(params.refreshUrl, {
		method: "POST",
		headers,
		body,
	});
	if (response.ok) {
		return (await response.json()) as RefreshCredentialsResponse;
	}
	if (isRetryableHttpStatus(response.status)) {
		throw new Error(
			`Credential refresh retryable failure: ${response.status}`,
		);
	}
	return null;
};
