/** @format */

const WORKOS_BASE_URL = "https://api.workos.com";

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
	organization_id: string;
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

const headers = (apiKey: string) => ({
	"Authorization": `Bearer ${apiKey}`,
	"Content-Type": "application/json",
});

const handleResponse = async <T>(res: Response): Promise<T> => {
	if (!res.ok) {
		const body = await res.text().catch(() => "");
		throw new Error(`WorkOS API error ${res.status}: ${body}`);
	}
	return res.json() as Promise<T>;
};

export const workos = {
	organizations: {
		get: async (
			apiKey: string,
			id: string,
		): Promise<WorkOSOrganization> =>
			handleResponse(
				await fetch(
					`${WORKOS_BASE_URL}/organizations/${id}`,
					{
						headers: headers(apiKey),
					},
				),
			),

		list: async (
			apiKey: string,
			params?: {
				limit?: number;
				before?: string;
				after?: string;
			},
		): Promise<WorkOSListResponse<WorkOSOrganization>> => {
			const url = new URL(`${WORKOS_BASE_URL}/organizations`);
			if (params?.limit)
				url.searchParams.set(
					"limit",
					String(params.limit),
				);
			if (params?.before)
				url.searchParams.set("before", params.before);
			if (params?.after)
				url.searchParams.set("after", params.after);
			return handleResponse(
				await fetch(url.toString(), {
					headers: headers(apiKey),
				}),
			);
		},

		create: async (
			apiKey: string,
			data: { name: string },
		): Promise<WorkOSOrganization> =>
			handleResponse(
				await fetch(
					`${WORKOS_BASE_URL}/organizations`,
					{
						method: "POST",
						headers: headers(apiKey),
						body: JSON.stringify(data),
					},
				),
			),

		update: async (
			apiKey: string,
			id: string,
			data: { name?: string },
		): Promise<WorkOSOrganization> =>
			handleResponse(
				await fetch(
					`${WORKOS_BASE_URL}/organizations/${id}`,
					{
						method: "PUT",
						headers: headers(apiKey),
						body: JSON.stringify(data),
					},
				),
			),

		delete: async (apiKey: string, id: string): Promise<void> => {
			const res = await fetch(
				`${WORKOS_BASE_URL}/organizations/${id}`,
				{
					method: "DELETE",
					headers: headers(apiKey),
				},
			);
			if (!res.ok) {
				const body = await res.text().catch(() => "");
				throw new Error(
					`WorkOS API error ${res.status}: ${body}`,
				);
			}
		},
	},

	users: {
		get: async (apiKey: string, id: string): Promise<WorkOSUser> =>
			handleResponse(
				await fetch(`${WORKOS_BASE_URL}/users/${id}`, {
					headers: headers(apiKey),
				}),
			),
	},
};
