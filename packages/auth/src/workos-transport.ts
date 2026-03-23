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
	const direct = readFirstString(record, ["roleSlug", "role_slug"]);
	if (direct) return direct;

	const role = asRecord(record.role);
	return readString(role, "slug");
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
		id: readString(record, "id") ?? "",
		email: readString(record, "email") ?? "",
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
		createdAt:
			readFirstString(record, ["createdAt", "created_at"]) ??
			"",
		updatedAt:
			readFirstString(record, ["updatedAt", "updated_at"]) ??
			"",
	};
};

const toAuthOrganization = (value: unknown): AuthOrganization => {
	const record = asRecord(value);

	return {
		id: readString(record, "id") ?? "",
		name: readString(record, "name") ?? "",
		createdAt:
			readFirstString(record, ["createdAt", "created_at"]) ??
			"",
		updatedAt:
			readFirstString(record, ["updatedAt", "updated_at"]) ??
			"",
	};
};

const toAuthOrganizationMembership = (
	value: unknown,
): AuthOrganizationMembership => {
	const record = asRecord(value);

	return {
		id: readString(record, "id") ?? "",
		userId: readFirstString(record, ["userId", "user_id"]) ?? "",
		organizationId:
			readFirstString(record, [
				"organizationId",
				"organization_id",
			]) ?? "",
		organizationName: readFirstString(record, [
			"organizationName",
			"organization_name",
		]),
		status:
			(readString(
				record,
				"status",
			) as AuthMembershipStatus | null) ?? "active",
		directoryManaged:
			readFirstBoolean(record, [
				"directoryManaged",
				"directory_managed",
			]) ?? false,
		roleSlug: readRoleSlug(record),
		createdAt:
			readFirstString(record, ["createdAt", "created_at"]) ??
			"",
		updatedAt:
			readFirstString(record, ["updatedAt", "updated_at"]) ??
			"",
	};
};

const toAuthSession = (value: unknown): AuthSessionWithoutMemberships => {
	const record = asRecord(value);
	const user = toAuthUser(record.user);

	return {
		sessionId:
			readFirstString(record, ["sessionId", "session_id"]) ??
			null,
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
			sealedSession:
				readString(record, "sealedSession") ??
				readString(record, "sealed_session") ??
				"",
			session: toAuthSession(record),
		};
	}

	return {
		authenticated: false,
		reason: readFailureReason(record),
	};
};

export const createWorkOSTransport = (config: {
	apiKey: string;
	clientId?: string;
}): AuthTransport => {
	const client = new WorkOS(config.apiKey, {
		...(config.clientId ? { clientId: config.clientId } : {}),
	}) as unknown as {
		userManagement: Record<string, unknown>;
		organizations: Record<string, unknown>;
	};
	const requireClientId = (): string => {
		if (!config.clientId) {
			throw new AuthConfigurationError(
				"WorkOS clientId is required for session and authorization helpers",
				"transport.clientId",
			);
		}

		return config.clientId;
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
			>(client.userManagement, "getAuthorizationUrl");

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
			>(client.userManagement, "authenticateWithCode");

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

			return {
				sealedSession:
					readString(response, "sealedSession") ??
					readString(
						response,
						"sealed_session",
					) ??
					"",
				session: toAuthSession(response),
			};
		},

		loadSealedSession: async ({
			sealedSession,
			cookiePassword,
		}): Promise<AuthTransportSession> => {
			const loadSealedSession = bindMethod<
				[
					{
						sessionData: string | undefined;
						cookiePassword: string;
					},
				],
				Promise<unknown>
			>(client.userManagement, "loadSealedSession");

			const loadedSession = asRecord(
				await loadSealedSession({
					sessionData: sealedSession,
					cookiePassword,
				}),
			);

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
				client.userManagement,
				"getUser",
			);

			return toAuthUser(await getUser(userId));
		},

		getOrganization: async ({ organizationId }) => {
			const getOrganization = bindMethod<
				[string],
				Promise<unknown>
			>(client.organizations, "getOrganization");

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
			>(client.organizations, "listOrganizations");

			const response = asRecord(
				await listOrganizations(input),
			);
			const data =
				Array.isArray(response.data) ?
					response.data.map(toAuthOrganization)
				:	[];
			const listMetadata =
				(
					asRecord(response.listMetadata)
						.before !== undefined
				) ?
					asRecord(response.listMetadata)
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
			>(client.organizations, "createOrganization");

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
			>(client.organizations, "updateOrganization");

			return toAuthOrganization(
				await updateOrganization({
					organization: organizationId,
					...(name ? { name } : {}),
				}),
			);
		},

		deleteOrganization: async ({ organizationId }) => {
			const deleteOrganization = bindMethod<
				[string],
				Promise<void>
			>(client.organizations, "deleteOrganization");

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
			>(client.userManagement, "listOrganizationMemberships");

			const response = asRecord(
				await listOrganizationMemberships({
					...(userId ? { userId } : {}),
					...(organizationId ?
						{ organizationId }
					:	{}),
					...(statuses ? { statuses } : {}),
				}),
			);

			return Array.isArray(response.data) ?
					response.data.map(
						toAuthOrganizationMembership,
					)
				:	[];
		},
	};
};
