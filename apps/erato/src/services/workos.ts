/** @format */

import { createWorkOSTransport } from "@vesta-cx/auth";

export type WorkOSOrganization = {
	id: string;
	name: string;
	created_at: string;
	updated_at: string;
	object: "organization";
};

export type WorkOSUser = {
	id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	organization_id: string | null;
	created_at: string;
	updated_at: string;
	object: "user";
};

type WorkOSListResponse<T> = {
	data: T[];
	list_metadata: {
		before: string | null;
		after: string | null;
	};
};

const transportCache = new Map<
	string,
	ReturnType<typeof createWorkOSTransport>
>();
const getTransport = (apiKey: string) => {
	let transport = transportCache.get(apiKey);
	if (!transport) {
		transport = createWorkOSTransport({ apiKey });
		transportCache.set(apiKey, transport);
	}
	return transport;
};

const toWorkOSOrganization = (
	organization: Awaited<
		ReturnType<ReturnType<typeof getTransport>["getOrganization"]>
	>,
): WorkOSOrganization => ({
	id: organization.id,
	name: organization.name,
	created_at: organization.createdAt,
	updated_at: organization.updatedAt,
	object: "organization",
});

const toWorkOSUser = (input: {
	user: Awaited<ReturnType<ReturnType<typeof getTransport>["getUser"]>>;
	organizationId: string | null;
}): WorkOSUser => ({
	id: input.user.id,
	email: input.user.email,
	first_name: input.user.firstName,
	last_name: input.user.lastName,
	organization_id: input.organizationId,
	created_at: input.user.createdAt,
	updated_at: input.user.updatedAt,
	object: "user",
});

export const workos = {
	organizations: {
		get: async (
			apiKey: string,
			id: string,
		): Promise<WorkOSOrganization> =>
			toWorkOSOrganization(
				await getTransport(apiKey).getOrganization({
					organizationId: id,
				}),
			),

		list: async (
			apiKey: string,
			params?: {
				limit?: number;
				before?: string;
				after?: string;
			},
		): Promise<WorkOSListResponse<WorkOSOrganization>> => {
			const result =
				await getTransport(apiKey).listOrganizations(
					params,
				);

			return {
				data: result.data.map(toWorkOSOrganization),
				list_metadata: {
					before: result.before,
					after: result.after,
				},
			};
		},

		create: async (
			apiKey: string,
			data: { name: string },
		): Promise<WorkOSOrganization> =>
			toWorkOSOrganization(
				await getTransport(apiKey).createOrganization(
					data,
				),
			),

		update: async (
			apiKey: string,
			id: string,
			data: { name?: string },
		): Promise<WorkOSOrganization> =>
			toWorkOSOrganization(
				await getTransport(apiKey).updateOrganization({
					organizationId: id,
					...(data.name ?
						{ name: data.name }
					:	{}),
				}),
			),

		delete: async (apiKey: string, id: string): Promise<void> =>
			getTransport(apiKey).deleteOrganization({
				organizationId: id,
			}),
	},

	users: {
		get: async (
			apiKey: string,
			id: string,
		): Promise<WorkOSUser> => {
			const transport = getTransport(apiKey);
			const user = await transport.getUser({ userId: id });

			return toWorkOSUser({
				user,
				organizationId: user.organizationId ?? null,
			});
		},
	},
};
