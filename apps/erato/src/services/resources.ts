/** @format */

import { and, eq, exists, or, sql, type SQL } from "drizzle-orm";
import type { AnyColumn } from "drizzle-orm";
import type { ListQueryConfig } from "@mia-cx/drizzle-query-factory";
export {
	resourceCreateSchema as createResourceSchema,
	resourceUpdateSchema as updateResourceSchema,
} from "@vesta-cx/db/entity-schemas";
import {
	permissions,
	RESOURCE_PERMISSION_ACTIONS,
	RESOURCE_STATUSES,
	resources,
} from "../db/schema";
import { ADMIN_SCOPE, type AuthContext } from "../auth/types";
import { hasScope } from "../auth/helpers";
import type { Database } from "../db";

const OWNER_SUBJECT_TYPES = ["user", "organization"] as const;
export const LISTED_RESOURCE_STATUS = RESOURCE_STATUSES[0];
export const RESOURCE_READ_ACTION = RESOURCE_PERMISSION_ACTIONS[0];
export const RESOURCE_LINK_SUBJECT_TYPE = "resource" as const;

export const resourceListConfig: ListQueryConfig = {
	filters: {
		status: { column: resources.status },
		type: { column: resources.type },
		owner_id: { column: resources.ownerId },
		owner_type: { column: resources.ownerType },
		title: { column: resources.title, op: "like" },
	},
	sortable: {
		created_at: resources.createdAt,
		updated_at: resources.updatedAt,
		title: resources.title,
	},
	defaultSort: { key: "created_at", dir: "desc" },
};

export const listedResourceWhere = eq(resources.status, LISTED_RESOURCE_STATUS);

export const isResourceOwnerSubject = (
	auth: AuthContext,
): auth is Extract<AuthContext, { subjectType: "user" | "organization" }> =>
	auth.type !== "guest" &&
	(OWNER_SUBJECT_TYPES as readonly string[]).includes(auth.subjectType);

export const resourceOwnerWhere = (auth: AuthContext): SQL | undefined => {
	if (!isResourceOwnerSubject(auth)) return undefined;
	return and(
		eq(resources.ownerType, auth.subjectType),
		eq(resources.ownerId, auth.subjectId),
	);
};

export const resourceMutationWhere = (auth: AuthContext, id: string): SQL => {
	if (hasScope(auth, ADMIN_SCOPE)) return eq(resources.id, id);
	const ownerWhere = resourceOwnerWhere(auth);
	return ownerWhere ? and(eq(resources.id, id), ownerWhere) : sql`0`;
};

export const resourceAccessWhere = (
	db: Database,
	auth: AuthContext,
	objectId: string | AnyColumn,
): SQL => {
	const ownerWhere = resourceOwnerWhere(auth);
	const explicitAllowWhere =
		isResourceOwnerSubject(auth) ?
			exists(
				db
					.select({ id: permissions.id })
					.from(permissions)
					.where(
						and(
							eq(
								permissions.subjectType,
								auth.subjectType,
							),
							eq(
								permissions.subjectId,
								auth.subjectId,
							),
							eq(
								permissions.objectType,
								RESOURCE_LINK_SUBJECT_TYPE,
							),
							eq(
								permissions.objectId,
								objectId,
							),
							eq(
								permissions.action,
								RESOURCE_READ_ACTION,
							),
							eq(
								permissions.value,
								"allow",
							),
						),
					),
			)
		:	undefined;

	const accessBranches = [
		listedResourceWhere,
		explicitAllowWhere,
		ownerWhere,
	].filter((branch): branch is SQL => branch !== undefined);

	return or(...accessBranches) ?? listedResourceWhere;
};

export const canReadResource = async (
	db: Database,
	auth: AuthContext,
	id: string,
): Promise<boolean> => {
	const where =
		hasScope(auth, ADMIN_SCOPE) ?
			eq(resources.id, id)
		:	and(eq(resources.id, id), resourceAccessWhere(db, auth, id));
	const [resource] = await db
		.select({ id: resources.id })
		.from(resources)
		.where(where)
		.limit(1);
	return Boolean(resource);
};

export const canMutateResource = async (
	db: Database,
	auth: AuthContext,
	id: string,
): Promise<boolean> => {
	const [resource] = await db
		.select({ id: resources.id })
		.from(resources)
		.where(resourceMutationWhere(auth, id))
		.limit(1);
	return Boolean(resource);
};
