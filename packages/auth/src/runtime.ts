/** @format */

import { Duration, Effect } from "effect";
import {
	DEFAULT_RETRY_ATTEMPTS,
	DEFAULT_RETRY_BASE_DELAY_MS,
} from "./constants.js";
import {
	AuthConfigurationError,
	type AuthError,
	normalizeAuthError,
	isRetryableAuthError,
	TerminalAuthError,
} from "./errors.js";
import type {
	AuthExchangeInput,
	AuthExchangeResult,
	AuthFactor,
	AuthMembershipStatus,
	AuthOrganization,
	AuthOrganizationListInput,
	AuthOrganizationListResult,
	AuthOrganizationMembership,
	AuthRuntimeConfig,
	AuthSession,
	AuthSessionCookieInput,
	AuthSessionFailureReason,
	AuthSessionResult,
	AuthSessionWithoutMemberships,
	AuthTransport,
	AuthTransportSession,
	AuthTransportSessionRefreshResult,
	AuthUser,
	WorkOSAuthEnv,
} from "./types.js";
import { createWorkOSTransport } from "./workos-transport.js";

export interface AuthRuntime {
	getAuthorizationUrl(input: {
		redirectUri: string;
		organizationId?: string;
		state?: string;
		screenHint?: "sign-in" | "sign-up";
	}): string;
	authenticateWithCode(
		input: AuthExchangeInput,
	): Promise<AuthExchangeResult>;
	authenticateSealedSession(
		input: AuthSessionCookieInput,
	): Promise<AuthSessionResult>;
	getLogoutUrl(input: {
		sealedSession: string | undefined;
		returnTo?: string;
	}): Promise<string | null>;
	getUser(input: { userId: string }): Promise<AuthUser>;
	updateUserDetails(input: {
		userId: string;
		email?: string;
		firstName?: string | null;
		lastName?: string | null;
	}): Promise<AuthUser>;
	changePassword(input: {
		userId: string;
		email: string;
		currentPassword: string;
		newPassword: string;
		ipAddress?: string;
		userAgent?: string;
	}): Promise<AuthUser>;
	listAuthFactors(input: { userId: string }): Promise<AuthFactor[]>;
	enrollTotpFactor(input: {
		userId: string;
		issuer?: string;
		label?: string;
	}): ReturnType<AuthTransport["enrollTotpFactor"]>;
	verifyTotpEnrollment(input: {
		userId: string;
		factorId: string;
		challengeId: string;
		code: string;
	}): ReturnType<AuthTransport["verifyAuthFactorChallenge"]>;
	deleteAuthFactor(input: {
		userId: string;
		factorId: string;
	}): Promise<void>;
	getOrganization(input: {
		organizationId: string;
	}): Promise<AuthOrganization>;
	listOrganizations(
		input?: AuthOrganizationListInput,
	): Promise<AuthOrganizationListResult>;
	createOrganization(input: { name: string }): Promise<AuthOrganization>;
	updateOrganization(input: {
		organizationId: string;
		name?: string;
	}): Promise<AuthOrganization>;
	deleteOrganization(input: { organizationId: string }): Promise<void>;
	listOrganizationMemberships(input: {
		userId?: string;
		organizationId?: string;
		statuses?: AuthMembershipStatus[];
	}): Promise<AuthOrganizationMembership[]>;
}

export interface AuthRuntimeFromEnvOptions extends Omit<
	AuthRuntimeConfig,
	"apiKey" | "clientId" | "cookiePassword" | "defaultOrganizationId"
> {
	defaultOrganizationId?: string;
}

const ensureRequiredConfig = (
	value: string | undefined,
	name: keyof Pick<
		AuthRuntimeConfig,
		"clientId" | "apiKey" | "cookiePassword"
	>,
): string => {
	if (!value) {
		throw new AuthConfigurationError(
			`Missing required auth config: ${name}`,
			`config.${name}`,
		);
	}

	return value;
};

const resolveActiveOrganizationId = (input: {
	sessionOrganizationId: string | null;
	preferredOrganizationId?: string | undefined;
	defaultOrganizationId?: string | undefined;
	memberships: AuthOrganizationMembership[];
}): string | null => {
	const activeMembershipIds = input.memberships
		.filter((membership) => membership.status === "active")
		.map((membership) => membership.organizationId);

	if (
		input.preferredOrganizationId &&
		activeMembershipIds.includes(input.preferredOrganizationId)
	) {
		return input.preferredOrganizationId;
	}

	if (
		input.sessionOrganizationId &&
		(activeMembershipIds.length === 0 ||
			activeMembershipIds.includes(
				input.sessionOrganizationId,
			))
	) {
		return input.sessionOrganizationId;
	}

	if (
		input.defaultOrganizationId &&
		activeMembershipIds.includes(input.defaultOrganizationId)
	) {
		return input.defaultOrganizationId;
	}

	return activeMembershipIds[0] ?? input.defaultOrganizationId ?? null;
};

const unauthenticated = (
	reason: AuthSessionFailureReason,
): AuthSessionResult => ({
	authenticated: false,
	refreshed: false,
	reason,
	sealedSession: null,
	session: null,
});

const maybeResolveMemberships = async (input: {
	resolveMemberships?: boolean;
	userId: string;
	runtime: Pick<AuthRuntime, "listOrganizationMemberships">;
}): Promise<AuthOrganizationMembership[]> => {
	if (!input.resolveMemberships) return [];

	return input.runtime.listOrganizationMemberships({
		userId: input.userId,
		statuses: ["active", "inactive", "pending"],
	});
};

const maybeProvisionSession = async (input: {
	session: AuthSession;
	defaultOrganizationId?: string | undefined;
	provisioningAdapter?: AuthExchangeInput["provisioningAdapter"];
}): Promise<AuthSession> => {
	if (!input.provisioningAdapter) {
		return input.session;
	}

	try {
		const provisioned = await input.provisioningAdapter.provision(
			input.defaultOrganizationId ?
				{
					session: input.session,
					fallbackOrganizationId:
						input.defaultOrganizationId,
				}
			:	{
					session: input.session,
				},
		);

		return {
			...input.session,
			organizationId: provisioned.activeOrganizationId,
		};
	} catch (error) {
		throw normalizeAuthError("provision", error);
	}
};

const buildAuthenticatedSession = async (input: {
	transportSession: AuthSessionWithoutMemberships;
	preferredOrganizationId?: string | undefined;
	defaultOrganizationId?: string | undefined;
	resolveMemberships?: boolean;
	provisioningAdapter?: AuthExchangeInput["provisioningAdapter"];
	runtime: Pick<AuthRuntime, "listOrganizationMemberships">;
}): Promise<AuthSession> => {
	const memberships = await maybeResolveMemberships({
		...(input.resolveMemberships !== undefined ?
			{ resolveMemberships: input.resolveMemberships }
		:	{}),
		userId: input.transportSession.userId,
		runtime: input.runtime,
	});

	return maybeProvisionSession({
		session: {
			...input.transportSession,
			organizationId: resolveActiveOrganizationId({
				sessionOrganizationId:
					input.transportSession.organizationId,
				...(input.preferredOrganizationId ?
					{
						preferredOrganizationId:
							input.preferredOrganizationId,
					}
				:	{}),
				...(input.defaultOrganizationId ?
					{
						defaultOrganizationId:
							input.defaultOrganizationId,
					}
				:	{}),
				memberships,
			}),
			memberships,
		},
		defaultOrganizationId: input.defaultOrganizationId,
		provisioningAdapter: input.provisioningAdapter,
	});
};

const refreshSealedSessionForOrganization = async (input: {
	sealedSession: string;
	organizationId: string | null;
	originalOrganizationId: string | null;
	loadSession: (sealedSession: string) => Promise<AuthTransportSession>;
	refreshSession: (
		sessionTransport: AuthTransportSession,
		organizationId: string,
	) => Promise<AuthTransportSessionRefreshResult>;
}): Promise<string> => {
	if (
		!input.organizationId ||
		input.organizationId === input.originalOrganizationId
	) {
		return input.sealedSession;
	}

	const sessionTransport = await input.loadSession(input.sealedSession);
	const refreshed = await input.refreshSession(
		sessionTransport,
		input.organizationId,
	);

	if (!refreshed.authenticated) {
		throw new TerminalAuthError(
			`Unable to refresh sealed session for organization ${input.organizationId}`,
			"refreshSealedSession",
			{ status: 401 },
		);
	}

	return refreshed.sealedSession;
};

const validateOptionalOrganizationName = (name: string | undefined) => {
	if (name !== undefined && !name.trim()) {
		throw new TerminalAuthError(
			"Organization name cannot be empty",
			"updateOrganization",
			{ status: 400 },
		);
	}

	return name;
};

const makeRetryEffect = <T>(
	config: {
		retryAttempts: number;
		retryBaseDelayMs: number;
		observer?: AuthRuntimeConfig["observer"];
	},
	operation: string,
	run: () => Promise<T>,
	retryCount = 0,
): Effect.Effect<T, AuthError> =>
	Effect.tryPromise({
		try: run,
		catch: (error) => normalizeAuthError(operation, error),
	}).pipe(
		Effect.catch((error: AuthError) => {
			if (
				!isRetryableAuthError(error) ||
				retryCount >= config.retryAttempts
			) {
				return Effect.fail(error);
			}

			config.observer?.({
				type: "auth.retry",
				operation,
				attempt: retryCount + 1,
				detail: error.message,
			});

			return Effect.sleep(
				Duration.millis(
					config.retryBaseDelayMs *
						2 ** retryCount,
				),
			).pipe(
				Effect.flatMap(() =>
					makeRetryEffect(
						config,
						operation,
						run,
						retryCount + 1,
					),
				),
			);
		}),
	);

export const createAuthRuntime = (config: AuthRuntimeConfig): AuthRuntime => {
	const clientId = ensureRequiredConfig(config.clientId, "clientId");
	const apiKey = ensureRequiredConfig(config.apiKey, "apiKey");
	const cookiePassword = ensureRequiredConfig(
		config.cookiePassword,
		"cookiePassword",
	);

	const transport: AuthTransport =
		config.transport ??
		createWorkOSTransport({
			apiKey,
			clientId,
		});

	const retryAttempts = config.retryAttempts ?? DEFAULT_RETRY_ATTEMPTS;
	const retryBaseDelayMs =
		config.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;

	const runWithRetry = <T>(operation: string, run: () => Promise<T>) =>
		Effect.runPromise(
			makeRetryEffect(
				{
					retryAttempts,
					retryBaseDelayMs,
					...(config.observer ?
						{ observer: config.observer }
					:	{}),
				},
				operation,
				run,
			),
		);

	const runtime: AuthRuntime = {
		getAuthorizationUrl: (input) =>
			transport.getAuthorizationUrl({
				redirectUri: input.redirectUri,
				...((
					(input.organizationId ??
					config.defaultOrganizationId)
				) ?
					{
						organizationId:
							input.organizationId ??
							config.defaultOrganizationId,
					}
				:	{}),
				...(input.state ? { state: input.state } : {}),
				...(input.screenHint ?
					{ screenHint: input.screenHint }
				:	{}),
			}),

		authenticateWithCode: async (input) => {
			const exchange = await runWithRetry(
				"authenticateWithCode",
				() =>
					transport.authenticateWithCode({
						code: input.code,
						cookiePassword,
						...(input.ipAddress ?
							{
								ipAddress: input.ipAddress,
							}
						:	{}),
						...(input.userAgent ?
							{
								userAgent: input.userAgent,
							}
						:	{}),
					}),
			);

			const memberships = await maybeResolveMemberships({
				resolveMemberships:
					input.resolveMemberships ?? true,
				userId: exchange.session.userId,
				runtime,
			});

			const session: AuthSession = {
				...exchange.session,
				organizationId: resolveActiveOrganizationId({
					sessionOrganizationId:
						exchange.session.organizationId,
					...(input.preferredOrganizationId ?
						{
							preferredOrganizationId:
								input.preferredOrganizationId,
						}
					:	{}),
					...(config.defaultOrganizationId ?
						{
							defaultOrganizationId:
								config.defaultOrganizationId,
						}
					:	{}),
					memberships,
				}),
				memberships,
			};

			if (memberships.length > 0) {
				config.observer?.({
					type: "auth.memberships.resolved",
					operation: "authenticateWithCode",
					detail: `${memberships.length} memberships`,
				});
			}

			const provisionedSession = await maybeProvisionSession({
				session,
				defaultOrganizationId:
					config.defaultOrganizationId,
				provisioningAdapter: input.provisioningAdapter,
			});

			config.observer?.({
				type:
					input.provisioningAdapter ?
						"auth.login.provisioned"
					:	"auth.login.completed",
				operation: "authenticateWithCode",
			});

			const sealedSession =
				await refreshSealedSessionForOrganization({
					sealedSession: exchange.sealedSession,
					organizationId:
						provisionedSession.organizationId,
					originalOrganizationId:
						exchange.session.organizationId,
					loadSession: (sealedSession) =>
						runWithRetry(
							"loadSealedSession",
							() =>
								transport.loadSealedSession(
									{
										sealedSession,
										cookiePassword,
									},
								),
						),
					refreshSession: (
						sessionTransport,
						organizationId,
					) =>
						runWithRetry(
							"refreshSealedSession",
							() =>
								sessionTransport.refresh(
									{
										organizationId,
									},
								),
						),
				});

			return {
				sealedSession,
				session: provisionedSession,
			};
		},

		authenticateSealedSession: async (input) => {
			if (!input.sealedSession) {
				return unauthenticated("missing_session");
			}

			const sessionTransport = await runWithRetry(
				"loadSealedSession",
				() =>
					transport.loadSealedSession({
						sealedSession:
							input.sealedSession,
						cookiePassword,
					}),
			);

			const authenticated = await runWithRetry(
				"authenticateSealedSession",
				() => sessionTransport.authenticate(),
			);

			if (authenticated.authenticated) {
				const session = await buildAuthenticatedSession(
					{
						transportSession:
							authenticated.session,
						resolveMemberships:
							input.resolveMemberships ??
							false,
						preferredOrganizationId:
							input.preferredOrganizationId,
						defaultOrganizationId:
							config.defaultOrganizationId,
						provisioningAdapter:
							input.provisioningAdapter,
						runtime,
					},
				);

				config.observer?.({
					type: "auth.session.authenticated",
					operation: "authenticateSealedSession",
				});

				return {
					authenticated: true,
					refreshed: false,
					reason: null,
					sealedSession: input.sealedSession,
					session,
				};
			}

			if (
				authenticated.reason ===
				"no_session_cookie_provided"
			) {
				return unauthenticated(
					"no_session_cookie_provided",
				);
			}

			const refreshed = await runWithRetry(
				"refreshSealedSession",
				() =>
					sessionTransport.refresh(
						input.preferredOrganizationId ?
							{
								organizationId:
									input.preferredOrganizationId,
							}
						:	undefined,
					),
			);

			if (!refreshed.authenticated) {
				return unauthenticated(
					refreshed.reason === "session_expired" ?
						"session_expired"
					:	"invalid_session",
				);
			}

			const session = await buildAuthenticatedSession({
				transportSession: refreshed.session,
				resolveMemberships:
					input.resolveMemberships ?? false,
				preferredOrganizationId:
					input.preferredOrganizationId,
				defaultOrganizationId:
					config.defaultOrganizationId,
				provisioningAdapter: input.provisioningAdapter,
				runtime,
			});

			config.observer?.({
				type: "auth.session.refreshed",
				operation: "authenticateSealedSession",
			});

			return {
				authenticated: true,
				refreshed: true,
				reason: null,
				sealedSession: refreshed.sealedSession,
				session,
			};
		},

		getLogoutUrl: async ({ sealedSession, returnTo }) => {
			if (!sealedSession) return null;

			try {
				const sessionTransport = await runWithRetry(
					"loadSealedSession",
					() =>
						transport.loadSealedSession({
							sealedSession,
							cookiePassword,
						}),
				);

				return await runWithRetry("getLogoutUrl", () =>
					returnTo ?
						sessionTransport.getLogoutUrl({
							returnTo,
						})
					:	sessionTransport.getLogoutUrl(),
				);
			} catch (error) {
				if (error instanceof TerminalAuthError) {
					return null;
				}

				throw error;
			}
		},

		getUser: ({ userId }) =>
			runWithRetry("getUser", () =>
				transport.getUser({ userId }),
			),

		updateUserDetails: ({ userId, email, firstName, lastName }) =>
			runWithRetry("updateUserDetails", () =>
				transport.updateUserDetails({
					userId,
					...(email !== undefined ?
						{ email }
					:	{}),
					...(firstName !== undefined ?
						{ firstName }
					:	{}),
					...(lastName !== undefined ?
						{ lastName }
					:	{}),
				}),
			),

		changePassword: async (input) => {
			const authenticatedUser = await runWithRetry(
				"authenticateWithPassword",
				() =>
					transport.authenticateWithPassword({
						email: input.email,
						password: input.currentPassword,
						...(input.ipAddress ?
							{
								ipAddress: input.ipAddress,
							}
						:	{}),
						...(input.userAgent ?
							{
								userAgent: input.userAgent,
							}
						:	{}),
					}),
			);

			if (authenticatedUser.id !== input.userId) {
				throw new TerminalAuthError(
					"Current password authenticated a different user",
					"changePassword",
				);
			}

			return runWithRetry("updateUserPassword", () =>
				transport.updateUserPassword({
					userId: input.userId,
					password: input.newPassword,
				}),
			);
		},

		listAuthFactors: ({ userId }) =>
			runWithRetry("listAuthFactors", () =>
				transport.listAuthFactors({ userId }),
			),

		enrollTotpFactor: ({ userId, issuer, label }) =>
			runWithRetry("enrollTotpFactor", () =>
				transport.enrollTotpFactor({
					userId,
					...(issuer ? { issuer } : {}),
					...(label ? { label } : {}),
				}),
			),

		verifyTotpEnrollment: async ({
			userId,
			factorId,
			challengeId,
			code,
		}) => {
			const factors = await runtime.listAuthFactors({
				userId,
			});
			if (!factors.some((factor) => factor.id === factorId)) {
				throw new TerminalAuthError(
					"Authentication factor does not belong to this user",
					"verifyTotpEnrollment",
					{ status: 404 },
				);
			}

			const verification = await runWithRetry(
				"verifyAuthFactorChallenge",
				() =>
					transport.verifyAuthFactorChallenge({
						challengeId,
						code,
					}),
			);
			if (!verification.valid) {
				throw new TerminalAuthError(
					"Authentication factor challenge code is invalid",
					"verifyTotpEnrollment",
					{ status: 400 },
				);
			}

			return verification;
		},

		deleteAuthFactor: async ({ userId, factorId }) => {
			const factors = await runtime.listAuthFactors({
				userId,
			});
			if (!factors.some((factor) => factor.id === factorId)) {
				throw new TerminalAuthError(
					"Authentication factor does not belong to this user",
					"deleteAuthFactor",
					{ status: 404 },
				);
			}

			return runWithRetry("deleteAuthFactor", () =>
				transport.deleteAuthFactor({ factorId }),
			);
		},

		getOrganization: ({ organizationId }) =>
			runWithRetry("getOrganization", () =>
				transport.getOrganization({ organizationId }),
			),

		listOrganizations: (input) =>
			runWithRetry("listOrganizations", () =>
				transport.listOrganizations(input),
			),

		createOrganization: ({ name }) =>
			runWithRetry("createOrganization", () =>
				transport.createOrganization({ name }),
			),

		updateOrganization: async ({ organizationId, name }) => {
			const validatedName =
				validateOptionalOrganizationName(name);
			return runWithRetry("updateOrganization", () =>
				transport.updateOrganization({
					organizationId,
					...(validatedName !== undefined ?
						{ name: validatedName }
					:	{}),
				}),
			);
		},

		deleteOrganization: ({ organizationId }) =>
			runWithRetry("deleteOrganization", () =>
				transport.deleteOrganization({
					organizationId,
				}),
			),

		listOrganizationMemberships: async ({
			userId,
			organizationId,
			statuses,
		}) => {
			if (!userId && !organizationId) {
				throw new TerminalAuthError(
					"Organization membership resolution requires a userId or organizationId",
					"listOrganizationMemberships",
				);
			}

			return runWithRetry("listOrganizationMemberships", () =>
				transport.listOrganizationMemberships({
					...(userId ? { userId } : {}),
					...(organizationId ?
						{ organizationId }
					:	{}),
					...(statuses ? { statuses } : {}),
				}),
			);
		},
	};

	return runtime;
};

export const createAuthRuntimeFromEnv = (
	env: WorkOSAuthEnv,
	options?: AuthRuntimeFromEnvOptions,
): AuthRuntime =>
	createAuthRuntime({
		clientId: env.PRIVATE_WORKOS_CLIENT_ID,
		apiKey: env.PRIVATE_WORKOS_API_KEY,
		cookiePassword: env.PRIVATE_WORKOS_COOKIE_PASSWORD,
		...((
			(options?.defaultOrganizationId ??
			env.PRIVATE_WORKOS_ORG_ID)
		) ?
			{
				defaultOrganizationId:
					options?.defaultOrganizationId ??
					env.PRIVATE_WORKOS_ORG_ID,
			}
		:	{}),
		...(options?.retryAttempts !== undefined ?
			{ retryAttempts: options.retryAttempts }
		:	{}),
		...(options?.retryBaseDelayMs !== undefined ?
			{ retryBaseDelayMs: options.retryBaseDelayMs }
		:	{}),
		...(options?.observer ? { observer: options.observer } : {}),
		...(options?.transport ? { transport: options.transport } : {}),
	});
