/** @format */

export type AuthErrorKind = "configuration" | "retryable" | "terminal";

export abstract class AuthError extends Error {
	abstract readonly kind: AuthErrorKind;
	override cause?: unknown;
	readonly operation: string;
	readonly status: number | undefined;

	constructor(
		message: string,
		operation: string,
		options?: {
			cause?: unknown;
			status?: number | undefined;
		},
	) {
		super(message);
		this.name = new.target.name;
		this.operation = operation;
		this.cause = options?.cause;
		this.status = options?.status;
	}
}

export class AuthConfigurationError extends AuthError {
	readonly kind = "configuration" as const;
}

export class RetryableAuthError extends AuthError {
	readonly kind = "retryable" as const;
}

export class TerminalAuthError extends AuthError {
	readonly kind = "terminal" as const;
}

const MIN_HTTP_STATUS = 100;
const MAX_HTTP_STATUS = 599;

const readHttpStatusProperty = (
	value: Record<string, unknown>,
	key: string,
): number | undefined => {
	const property = value[key];
	return (
			typeof property === "number" &&
				Number.isInteger(property) &&
				property >= MIN_HTTP_STATUS &&
				property <= MAX_HTTP_STATUS
		) ?
			property
		:	undefined;
};

export const extractStatus = (error: unknown): number | undefined => {
	if (!error || typeof error !== "object") return undefined;

	const record = error as Record<string, unknown>;
	return (
		readHttpStatusProperty(record, "status") ??
		readHttpStatusProperty(record, "statusCode") ??
		readHttpStatusProperty(record, "code")
	);
};

export const normalizeAuthError = (
	operation: string,
	error: unknown,
): AuthError => {
	if (error instanceof AuthError) return error;

	const status = extractStatus(error);
	const message =
		error instanceof Error ?
			error.message
		:	`Auth operation failed: ${String(error)}`;

	if (status === 429 || (typeof status === "number" && status >= 500)) {
		return new RetryableAuthError(message, operation, {
			cause: error,
			status,
		});
	}

	return new TerminalAuthError(message, operation, {
		cause: error,
		status,
	});
};

export const isRetryableAuthError = (
	error: unknown,
): error is RetryableAuthError => error instanceof RetryableAuthError;
