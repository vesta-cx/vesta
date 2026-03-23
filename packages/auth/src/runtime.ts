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
	AuthTransport,
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
}) => {
	if (!input.provisioningAdapter) {
		return input.session;
	}

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
};

const makeRetryEffect = <T>(
	config: {
		retryAttempts: number;
		retryBaseDelayMs: number;
		observer?: AuthRuntimeConfig["observer"];
	},
	operation: string,
	run: () => Promise<T>,
	attempt = 1,
): Effect.Effect<T, AuthError> =>
	Effect.tryPromise({
		try: run,
		catch: (error) => normalizeAuthError(operation, error),
	}).pipe(
		Effect.catch((error: AuthError) => {
			if (
				!isRetryableAuthError(error) ||
				attempt >= config.retryAttempts
			) {
				return Effect.fail(error);
			}

			config.observer?.({
				type: "auth.retry",
				operation,
				attempt,
				detail: error.message,
			});

			return Effect.sleep(
				Duration.millis(
					config.retryBaseDelayMs * attempt,
				),
			).pipe(
				Effect.flatMap(() =>
					makeRetryEffect(
						config,
						operation,
						run,
						attempt + 1,
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

			return {
				sealedSession: exchange.sealedSession,
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

			if (!authenticated.authenticated) {
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
							(
								input.preferredOrganizationId
							) ?
								{
									organizationId:
										input.preferredOrganizationId,
								}
							:	undefined,
						),
				);

				if (!refreshed.authenticated) {
					return unauthenticated(
						(
							refreshed.reason ===
								"session_expired"
						) ?
							"session_expired"
						:	"invalid_session",
					);
				}

				const memberships =
					await maybeResolveMemberships({
						resolveMemberships:
							input.resolveMemberships ??
							false,
						userId: refreshed.session
							.userId,
						runtime,
					});

				const session = await maybeProvisionSession({
					session: {
						...refreshed.session,
						organizationId:
							resolveActiveOrganizationId(
								{
									sessionOrganizationId:
										refreshed
											.session
											.organizationId,
									...((
										input.preferredOrganizationId
									) ?
										{
											preferredOrganizationId:
												input.preferredOrganizationId,
										}
									:	{}),
									...((
										config.defaultOrganizationId
									) ?
										{
											defaultOrganizationId:
												config.defaultOrganizationId,
										}
									:	{}),
									memberships,
								},
							),
						memberships,
					},
					defaultOrganizationId:
						config.defaultOrganizationId,
					provisioningAdapter:
						input.provisioningAdapter,
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
			}

			const memberships = await maybeResolveMemberships({
				resolveMemberships:
					input.resolveMemberships ?? false,
				userId: authenticated.session.userId,
				runtime,
			});

			const session = await maybeProvisionSession({
				session: {
					...authenticated.session,
					organizationId:
						resolveActiveOrganizationId({
							sessionOrganizationId:
								authenticated
									.session
									.organizationId,
							...((
								input.preferredOrganizationId
							) ?
								{
									preferredOrganizationId:
										input.preferredOrganizationId,
								}
							:	{}),
							...((
								config.defaultOrganizationId
							) ?
								{
									defaultOrganizationId:
										config.defaultOrganizationId,
								}
							:	{}),
							memberships,
						}),
					memberships,
				},
				defaultOrganizationId:
					config.defaultOrganizationId,
				provisioningAdapter: input.provisioningAdapter,
			});

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

		updateOrganization: ({ organizationId, name }) =>
			runWithRetry("updateOrganization", () =>
				transport.updateOrganization({
					organizationId,
					...(name ? { name } : {}),
				}),
			),

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
		...(options?.retryAttempts ?
			{ retryAttempts: options.retryAttempts }
		:	{}),
		...(options?.retryBaseDelayMs ?
			{ retryBaseDelayMs: options.retryBaseDelayMs }
		:	{}),
		...(options?.observer ? { observer: options.observer } : {}),
		...(options?.transport ? { transport: options.transport } : {}),
	});
