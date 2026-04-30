/** @format */

import { WorkOS } from "@workos-inc/node";
import { AuthConfigurationError } from "./errors.js";
import type {
	AuthAuthorizationUrlInput,
	AuthMembershipStatus,
	AuthOrganization,
	AuthOrganizationListInput,
	AuthOrganizationListResult,
	AuthOrganizationMembership,
	AuthSessionFailureReason,
	AuthSessionWithoutMemberships,
	AuthTransport,
	AuthTransportSession,
	AuthTransportSessionAuthenticateResult,
	AuthTransportSessionRefreshResult,
	AuthUser,
} from "./types.js";

const asRecord = (value: unknown): Record<string, unknown> =>
	value && typeof value === "object" ?
		(value as Record<string, unknown>)
	:	{};

const readString = (
	record: Record<string, unknown>,
	key: string,
): string | null => {
	const value = record[key];
	return typeof value === "string" ? value : null;
};

const missingFieldError = (mapper: string, field: string): Error =>
	new Error(`${mapper}: missing required field "${field}"`);

const requireString = (
	mapper: string,
	record: Record<string, unknown>,
	key: string,
): string => {
	const value = readString(record, key);
	if (!value) {
		throw missingFieldError(mapper, key);
	}

	return value;
};

const readBoolean = (
	record: Record<string, unknown>,
	key: string,
): boolean | null => {
	const value = record[key];
	return typeof value === "boolean" ? value : null;
};

const readFirstString = (
	record: Record<string, unknown>,
	keys: string[],
): string | null => {
	for (const key of keys) {
		const value = readString(record, key);
		if (value !== null) return value;
	}

	return null;
};

const requireFirstString = (
	mapper: string,
	record: Record<string, unknown>,
	keys: string[],
): string => {
	const value = readFirstString(record, keys);
	if (!value) {
		throw missingFieldError(mapper, keys.join('" or "'));
	}

	return value;
};

const readFirstBoolean = (
	record: Record<string, unknown>,
	keys: string[],
): boolean | null => {
	for (const key of keys) {
		const value = readBoolean(record, key);
		if (value !== null) return value;
	}

	return null;
};

const readStringArray = (
	record: Record<string, unknown>,
	key: string,
): string[] => {
	const value = record[key];
	return Array.isArray(value) ?
			value.filter(
				(entry): entry is string =>
					typeof entry === "string",
			)
		:	[];
};

const readRoleSlug = (record: Record<string, unknown>): string | null => {
	const direct = readFirstString(record, [
		"roleSlug",
		"role_slug",
		"role",
	]);
	if (direct) return direct;

	const role = asRecord(record.role);
	return readString(role, "slug");
};

const isAuthMembershipStatus = (value: string): value is AuthMembershipStatus =>
	value === "active" || value === "inactive" || value === "pending";

const readMembershipStatus = (
	record: Record<string, unknown>,
): AuthMembershipStatus => {
	const status = readString(record, "status");
	if (!status) {
		throw missingFieldError(
			"toAuthOrganizationMembership",
			"status",
		);
	}

	if (!isAuthMembershipStatus(status)) {
		throw new Error(
			`toAuthOrganizationMembership: invalid status "${status}"`,
		);
	}

	return status;
};

const isAutoPaginatable = <T>(
	value: unknown,
): value is {
	data: T[];
	autoPagination: () => Promise<T[]>;
} => {
	const record = asRecord(value);

	return (
		Array.isArray(record.data) &&
		typeof record.autoPagination === "function"
	);
};

const requireSdkSurface = (
	client: unknown,
	key: "userManagement" | "organizations",
): Record<string, unknown> => {
	const surface = asRecord(client)[key];
	if (!surface || typeof surface !== "object") {
		throw new AuthConfigurationError(
			`WorkOS SDK surface "${key}" is not available`,
			`transport.${key}`,
		);
	}

	return surface as Record<string, unknown>;
};

const bindMethod = <TArgs extends unknown[], TReturn>(
	target: Record<string, unknown>,
	key: string,
): ((...args: TArgs) => TReturn) => {
	const method = target[key];
	if (typeof method !== "function") {
		throw new AuthConfigurationError(
			`WorkOS SDK method "${key}" is not available`,
			`transport.${key}`,
		);
	}

	return (...args: TArgs) =>
		(method as (...innerArgs: TArgs) => TReturn).apply(
			target,
			args,
		);
};

const readFailureReason = (
	record: Record<string, unknown>,
): AuthSessionFailureReason => {
	const reason = readString(record, "reason");

	switch (reason) {
		case "no_session_cookie_provided":
			return "no_session_cookie_provided";
		case "session_expired":
			return "session_expired";
		case "invalid_session":
			return "invalid_session";
		default:
			return "authentication_failed";
	}
};

const toAuthUser = (value: unknown): AuthUser => {
	const record = asRecord(value);

	return {
		id: requireString("toAuthUser", record, "id"),
		email: requireString("toAuthUser", record, "email"),
		firstName: readFirstString(record, ["firstName", "first_name"]),
		lastName: readFirstString(record, ["lastName", "last_name"]),
		emailVerified:
			readFirstBoolean(record, [
				"emailVerified",
				"email_verified",
			]) ?? false,
		profilePictureUrl: readFirstString(record, [
			"profilePictureUrl",
			"profile_picture_url",
		]),
		organizationId: readFirstString(record, [
			"organizationId",
			"organization_id",
		]),
		createdAt: requireFirstString("toAuthUser", record, [
			"createdAt",
			"created_at",
		]),
		updatedAt: requireFirstString("toAuthUser", record, [
			"updatedAt",
			"updated_at",
		]),
	};
};

const toAuthOrganization = (value: unknown): AuthOrganization => {
	const record = asRecord(value);

	return {
		id: requireString("toAuthOrganization", record, "id"),
		name: requireString("toAuthOrganization", record, "name"),
		createdAt: requireFirstString("toAuthOrganization", record, [
			"createdAt",
			"created_at",
		]),
		updatedAt: requireFirstString("toAuthOrganization", record, [
			"updatedAt",
			"updated_at",
		]),
	};
};

const toAuthOrganizationMembership = (
	value: unknown,
): AuthOrganizationMembership => {
	const record = asRecord(value);

	return {
		id: requireString("toAuthOrganizationMembership", record, "id"),
		userId: requireFirstString(
			"toAuthOrganizationMembership",
			record,
			["userId", "user_id"],
		),
		organizationId: requireFirstString(
			"toAuthOrganizationMembership",
			record,
			["organizationId", "organization_id"],
		),
		organizationName: readFirstString(record, [
			"organizationName",
			"organization_name",
		]),
		status: readMembershipStatus(record),
		directoryManaged:
			readFirstBoolean(record, [
				"directoryManaged",
				"directory_managed",
			]) ?? false,
		roleSlug: readRoleSlug(record),
		createdAt: requireFirstString(
			"toAuthOrganizationMembership",
			record,
			["createdAt", "created_at"],
		),
		updatedAt: requireFirstString(
			"toAuthOrganizationMembership",
			record,
			["updatedAt", "updated_at"],
		),
	};
};

const toAuthSession = (value: unknown): AuthSessionWithoutMemberships => {
	const record = asRecord(value);
	const user = toAuthUser(record.user);

	return {
		sessionId: readFirstString(record, ["sessionId", "session_id"]),
		userId: user.id,
		email: user.email,
		firstName: user.firstName,
		lastName: user.lastName,
		emailVerified: user.emailVerified,
		profilePictureUrl: user.profilePictureUrl,
		organizationId:
			readFirstString(record, [
				"organizationId",
				"organization_id",
			]) ?? null,
		roleSlug: readRoleSlug(record),
		permissions: readStringArray(record, "permissions"),
		entitlements: readStringArray(record, "entitlements"),
	};
};

const toAuthenticateResult = (
	value: unknown,
): AuthTransportSessionAuthenticateResult => {
	const record = asRecord(value);

	if (record.authenticated === true) {
		return {
			authenticated: true,
			session: toAuthSession(record),
		};
	}

	return {
		authenticated: false,
		reason: readFailureReason(record),
	};
};

const toRefreshResult = (value: unknown): AuthTransportSessionRefreshResult => {
	const record = asRecord(value);

	if (record.authenticated === true) {
		return {
			authenticated: true,
			sealedSession: requireFirstString(
				"toRefreshResult",
				record,
				["sealedSession", "sealed_session"],
			),
			session: toAuthSession(record),
		};
	}

	return {
		authenticated: false,
		reason: readFailureReason(record),
	};
};

/**
 * Creates an auth transport backed by the official WorkOS Node SDK.
 *
 * `apiKey` is required for every operation. `clientId` is required for AuthKit
 * URL generation, OAuth code exchange, and sealed-session helpers; organization
 * read/write methods can be used without it.
 */
export const createWorkOSTransport = (config: {
	apiKey: string;
	clientId?: string;
}): AuthTransport => {
	const client = new WorkOS(config.apiKey, {
		...(config.clientId ? { clientId: config.clientId } : {}),
	});
	const userManagement = requireSdkSurface(client, "userManagement");
	const organizations = requireSdkSurface(client, "organizations");
	const requireClientId = (): string => {
		if (!config.clientId) {
			throw new AuthConfigurationError(
				"WorkOS clientId is required for session and authorization helpers",
				"transport.clientId",
			);
		}

		return config.clientId;
	};

	const loadSealedSessionRecord = async (input: {
		sealedSession: string | undefined;
		cookiePassword: string;
	}) => {
		const loadSealedSession = bindMethod<
			[
				{
					sessionData: string | undefined;
					cookiePassword: string;
				},
			],
			Promise<unknown>
		>(userManagement, "loadSealedSession");

		return asRecord(
			await loadSealedSession({
				sessionData: input.sealedSession,
				cookiePassword: input.cookiePassword,
			}),
		);
	};

	return {
		getAuthorizationUrl: (input: AuthAuthorizationUrlInput) => {
			const getAuthorizationUrl = bindMethod<
				[
					{
						provider: "authkit";
						clientId: string;
						redirectUri: string;
						organizationId?: string;
						state?: string;
						screenHint?:
							| "sign-in"
							| "sign-up";
					},
				],
				string
			>(userManagement, "getAuthorizationUrl");

			return getAuthorizationUrl({
				provider: "authkit",
				clientId: requireClientId(),
				redirectUri: input.redirectUri,
				...(input.organizationId ?
					{ organizationId: input.organizationId }
				:	{}),
				...(input.state ? { state: input.state } : {}),
				...(input.screenHint ?
					{ screenHint: input.screenHint }
				:	{}),
			});
		},

		authenticateWithCode: async ({
			code,
			cookiePassword,
			ipAddress,
			userAgent,
		}) => {
			const authenticateWithCode = bindMethod<
				[
					{
						clientId: string;
						code: string;
						ipAddress?: string;
						userAgent?: string;
						session: {
							sealSession: true;
							cookiePassword: string;
						};
					},
				],
				Promise<unknown>
			>(userManagement, "authenticateWithCode");

			const response = asRecord(
				await authenticateWithCode({
					clientId: requireClientId(),
					code,
					...(ipAddress ? { ipAddress } : {}),
					...(userAgent ? { userAgent } : {}),
					session: {
						sealSession: true,
						cookiePassword,
					},
				}),
			);

			const sealedSession = requireFirstString(
				"authenticateWithCode",
				response,
				["sealedSession", "sealed_session"],
			);
			const loadedSession = await loadSealedSessionRecord({
				sealedSession,
				cookiePassword,
			});
			const authenticate = bindMethod<[], Promise<unknown>>(
				loadedSession,
				"authenticate",
			);
			const authenticated = toAuthenticateResult(
				await authenticate(),
			);

			if (!authenticated.authenticated) {
				throw new Error(
					`authenticateWithCode: sealed session authentication failed with reason "${authenticated.reason}"`,
				);
			}

			return {
				sealedSession,
				session: authenticated.session,
			};
		},

		authenticateWithPassword: async ({
			email,
			password,
			ipAddress,
			userAgent,
		}) => {
			const authenticateWithPassword = bindMethod<
				[
					{
						clientId: string;
						email: string;
						password: string;
						ipAddress?: string;
						userAgent?: string;
					},
				],
				Promise<unknown>
			>(userManagement, "authenticateWithPassword");

			const response = asRecord(
				await authenticateWithPassword({
					clientId: requireClientId(),
					email,
					password,
					...(ipAddress ? { ipAddress } : {}),
					...(userAgent ? { userAgent } : {}),
				}),
			);

			return toAuthUser(response.user);
		},

		loadSealedSession: async ({
			sealedSession,
			cookiePassword,
		}): Promise<AuthTransportSession> => {
			const loadedSession = await loadSealedSessionRecord({
				sealedSession,
				cookiePassword,
			});

			const authenticate = bindMethod<[], Promise<unknown>>(
				loadedSession,
				"authenticate",
			);
			const refresh = bindMethod<
				[
					{
						organizationId?: string;
					}?,
				],
				Promise<unknown>
			>(loadedSession, "refresh");

			const logoutMethod =
				(
					typeof loadedSession.getLogoutUrl ===
					"function"
				) ?
					bindMethod<
						[
							{
								returnTo?: string;
							}?,
						],
						Promise<string>
					>(loadedSession, "getLogoutUrl")
				:	bindMethod<
						[
							{
								returnTo?: string;
							}?,
						],
						Promise<string>
					>(loadedSession, "getLogOutUrl");

			return {
				authenticate: async () =>
					toAuthenticateResult(
						await authenticate(),
					),
				refresh: async (input) =>
					toRefreshResult(await refresh(input)),
				getLogoutUrl: async (input) =>
					logoutMethod(input),
			};
		},

		getUser: async ({ userId }) => {
			const getUser = bindMethod<[string], Promise<unknown>>(
				userManagement,
				"getUser",
			);

			return toAuthUser(await getUser(userId));
		},

		updateUserPassword: async ({ userId, password }) => {
			const updateUser = bindMethod<
				[
					{
						userId: string;
						password: string;
					},
				],
				Promise<unknown>
			>(userManagement, "updateUser");

			return toAuthUser(
				await updateUser({
					userId,
					password,
				}),
			);
		},

		getOrganization: async ({ organizationId }) => {
			const getOrganization = bindMethod<
				[string],
				Promise<unknown>
			>(organizations, "getOrganization");

			return toAuthOrganization(
				await getOrganization(organizationId),
			);
		},

		listOrganizations: async (
			input?: AuthOrganizationListInput,
		): Promise<AuthOrganizationListResult> => {
			const listOrganizations = bindMethod<
				[AuthOrganizationListInput?],
				Promise<unknown>
			>(organizations, "listOrganizations");

			const response = asRecord(
				await listOrganizations(input),
			);
			const data =
				Array.isArray(response.data) ?
					response.data.map(toAuthOrganization)
				:	[];
			const camelMetadata = asRecord(response.listMetadata);
			const listMetadata =
				(
					camelMetadata.before !== undefined ||
					camelMetadata.after !== undefined
				) ?
					camelMetadata
				:	asRecord(response.list_metadata);

			return {
				data,
				before: readString(listMetadata, "before"),
				after: readString(listMetadata, "after"),
			};
		},

		createOrganization: async ({ name }) => {
			const createOrganization = bindMethod<
				[
					{
						name: string;
					},
				],
				Promise<unknown>
			>(organizations, "createOrganization");

			return toAuthOrganization(
				await createOrganization({ name }),
			);
		},

		updateOrganization: async ({ organizationId, name }) => {
			const updateOrganization = bindMethod<
				[
					{
						organization: string;
						name?: string;
					},
				],
				Promise<unknown>
			>(organizations, "updateOrganization");

			return toAuthOrganization(
				await updateOrganization({
					organization: organizationId,
					...(name !== undefined ? { name } : {}),
				}),
			);
		},

		deleteOrganization: async ({ organizationId }) => {
			const deleteOrganization = bindMethod<
				[string],
				Promise<void>
			>(organizations, "deleteOrganization");

			await deleteOrganization(organizationId);
		},

		listOrganizationMemberships: async ({
			userId,
			organizationId,
			statuses,
		}) => {
			const listOrganizationMemberships = bindMethod<
				[
					{
						userId?: string;
						organizationId?: string;
						statuses?: AuthMembershipStatus[];
					},
				],
				Promise<unknown>
			>(userManagement, "listOrganizationMemberships");

			const response = await listOrganizationMemberships({
				...(userId ? { userId } : {}),
				...(organizationId ? { organizationId } : {}),
				...(statuses ? { statuses } : {}),
			});

			if (isAutoPaginatable<unknown>(response)) {
				return (await response.autoPagination()).map(
					toAuthOrganizationMembership,
				);
			}

			const record = asRecord(response);
			return Array.isArray(record.data) ?
					record.data.map(
						toAuthOrganizationMembership,
					)
				:	[];
		},
	};
};
