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

const readNumericProperty = (
	value: Record<string, unknown>,
	key: string,
): number | undefined => {
	const property = value[key];
	return typeof property === "number" ? property : undefined;
};

export const extractStatus = (error: unknown): number | undefined => {
	if (!error || typeof error !== "object") return undefined;

	const record = error as Record<string, unknown>;
	return (
		readNumericProperty(record, "status") ??
		readNumericProperty(record, "statusCode") ??
		readNumericProperty(record, "code")
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

export const isExpectedAuthenticationFailure = (
	error: unknown,
): error is AuthError =>
	error instanceof AuthError &&
	error.operation === "authenticateWithCode" &&
	(error.status === 400 || error.status === 401 || error.status === 403);
